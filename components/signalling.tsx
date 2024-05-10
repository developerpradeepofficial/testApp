import {
  ScreenCapturePickerView,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  RTCView,
  MediaStream,
  MediaStreamTrack,
  mediaDevices,
  registerGlobals,
} from "react-native-webrtc";
import { SimpleSocketIO, SimpleSocketIOOptions } from "./websocket";

enum SignalingState {
  ConnectionOpen,
  ConnectionClosed,
  ConnectionError,
}

enum CallState {
  Idle = "idle",
  CallStateNew = "new",
  CallStateRinging = "ringing",
  CallStateInvite = "invite",
  CallStateConnected = "connected",
  CallStateBye = "bye",
  CallPeerNotFound = "not_found",
}
enum VideoSource {
  Camera,
  Screen,
}

export interface SessionOptions {
  sid: string;
  pid: string;
}
export class Session {
  sid: string;
  pid: string;
  pc: RTCPeerConnection | null = null;
  remoteCandidates: RTCIceCandidate[] = [];

  constructor(options: SessionOptions) {
    this.sid = options.sid;
    this.pid = options.pid;
  }
}

interface SignalingOptions {
  host: string;
  selfId: string;
}

class Signaling {
  constructor(options: SignalingOptions) {
    this._host = options.host;
    this._selfId = options.selfId;
  }
  static _socket: SimpleSocketIO | null = null;
  private _host: string;
  private _selfId: string;
  private _sessions: Record<string, Session> = {};
  private _localStream: MediaStream | null = null;
  private _remoteStreams: MediaStream[] = [];
  private _senders: RTCRtpSender[] = [];
  private _videoSource: VideoSource = VideoSource.Camera;
  private isErrorTriggered = false;
  public onSignalingStateChange?: (state: SignalingState) => void;
  public onCallStateChange?: (session: Session, state: CallState) => void;
  public onLocalStream?: (stream: any) => void;
  public onAddRemoteStream?: (session: Session, stream: MediaStream) => void;
  public onRemoveRemoteStream?: (session: Session, stream: MediaStream) => void;
  public onPeersUpdate?: (event: Record<string, any>) => void;

  // ICE servers configuration
  private _iceServers: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:3.109.188.197:3478",
      username: "user",
      credential: "pass",
    },
  ];
  // SDP configuration
  private _config: RTCConfiguration = {
    iceServers: this._iceServers,

    // iceTransportPolicy: "all",
    // sdpSemantics: "unified-plan",
    // bundlePolicy: "max-compat",
    // rtcpMuxPolicy: "require",
    // ...this._createRTCConfiguration(),
  };
  async close(): Promise<void> {
    await this._cleanSessions();
    Signaling._socket?.close();
  }

  switchCamera(): void {
    // if (this._localStream) {
    //   if (this._videoSource !== VideoSource.Camera) {
    //     this._senders.forEach((sender) => {
    //       sender.replaceTrack(this._localStream!.getVideoTracks()[0]);
    //     });
    //     this._videoSource = VideoSource.Camera;
    //     this.onLocalStream?.(this._localStream!);
    //   } else {
    //     // You need to implement the logic for switching the camera track here
    //     // For example, if you have a helper function to switch camera tracks, you can call it here
    //     // Helper.switchCamera(this._localStream!.getVideoTracks()[0]);
    //     console.log(
    //       "Switching Camera Feature Logic Needs to be implemented!!!"
    //     );
    //   }
    // }
  }
  muteMic(): void {
    if (this._localStream) {
      const audioTrack = this._localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }

  async invite(peerId: string, media: string): Promise<void> {
    const sessionId = this._selfId + "-" + peerId;
    const session = await this._createSession(null, peerId, sessionId, media);
    this._sessions[sessionId] = session;
    console.log("Session ", session);
    await this._createOffer(session, media);
    if (this.onCallStateChange) {
      this.onCallStateChange(session, CallState.CallStateNew);
      this.onCallStateChange(session, CallState.CallStateInvite);
    }
  }

  bye(sessionId: string): void {
    const session = this._sessions[sessionId];
    if (session) {
      this._closeSession(session);
    }
    Signaling._send("bye", {
      session_id: sessionId,
      from: this._selfId,
    });
  }

  async accept(sessionId: string, media: string): Promise<void> {
    const session = this._sessions[sessionId];

    if (session) {
      await this._createAnswer(session, media);
    }
  }

  reject(sessionId: string): void {
    const session = this._sessions[sessionId];
    if (session) {
      this.bye(sessionId);
    }
  }
  async connect(): Promise<void> {
    const socketOptions: SimpleSocketIOOptions = {
      url: `ws://${this._host}/ws`, // WebSocket server URL
      onOpen: () => {
        console.log("Socket connected.");
        // Send initial message or perform actions on socket open
        Signaling._send("new", {
          name: "New Peer Connection ",
          id: this._selfId,
          user_agent: navigator.userAgent,
        });
      },
      onMessage: (msg) => {
        console.log("Received message:", msg);
        this.onMessage(msg);
      },
      onClose: (code, reason) => {
        console.log("Socket closed:", code, reason);
        this.onSignalingStateChange?.(SignalingState.ConnectionClosed);
      },
    };
    Signaling._socket = new SimpleSocketIO(socketOptions);
    Signaling._socket.connect();
    console.log("connect to", socketOptions);

    this._iceServers = [
      {
        urls: "turn:3.109.188.197:3478",
        username: "user",
        credential: "pass",
      },
    ];
  }
  static _send(event: string, data: any): void {
    // console.log("Sending Data", event, "Data", data);
    this._socket?.send({ type: event, data: data });
  }
  private _createRTCConfiguration(): RTCConfiguration {
    return {
      iceServers: this._iceServers,
      iceTransportPolicy: "all",
      // sdpSemantics: "unified-plan",
      bundlePolicy: "max-compat",
      rtcpMuxPolicy: "require",
    };
  }
  // Getter for SDP semantics
  get sdpSemantics(): string {
    return "unified-plan";
  }
  private async createStream(media: string): Promise<any> {
    try {
      const mediaConstraints: MediaStreamConstraints = {
        audio: true,
        video: media === "video" ? true : false,
      };
      const stream = await mediaDevices.getUserMedia(mediaConstraints);
      this.onLocalStream?.(stream);
      return stream;
    } catch (error) {
      console.error("Error accessing media stream:", error);
      return null;
    }
  }
  private async _createSession(
    session: Session | null,
    peerId: string,
    sessionId: string,
    media: string
  ): Promise<Session> {
    this.isErrorTriggered = false;
    const newSession = session ?? new Session({ sid: sessionId, pid: peerId });

    this._localStream = await this.createStream(media);
    console.log("Local", this._localStream);
    const pc = new RTCPeerConnection(this._config);
    // Need to handle sdpSecmants
    pc.addEventListener("icecandidate", async (event) => {
      if (event.candidate) {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 1000); // Delay for 1 second
        });

        Signaling._send("candidate", {
          to: peerId,
          from: this._selfId,
          candidate: event.candidate,
          session_id: sessionId,
        });
      }
    });

    pc.addEventListener("iceconnectionstatechange", (event) => {
      console.log("On ICE Candidate State Change ", event);
    });

    pc.addEventListener("track", (event) => {
      this.onAddRemoteStream?.(newSession, event.streams[0]);
    });

    // pc.onremovestream = (event) => {
    //   this.onRemoveRemoteStream?.(newSession, event.stream);
    //   this._remoteStreams = this._remoteStreams.filter(
    //     (stream) => stream.id !== event.stream.id
    //   );
    // };

    // if (this._localStream) {
    this._localStream!.getTracks().forEach((track) => {
      console.log("Remote Stream", track);
      this._senders.push(
        pc.addTrack(track, this._localStream!) as unknown as any
      );
    });
    // }
    newSession.pc = pc;
    return newSession;
  }
  private _fixSdp(s: RTCSessionDescriptionInit): RTCSessionDescriptionInit {
    let sdp = s.sdp ?? "";
    sdp = sdp.replace("profile-level-id=640c1f", "profile-level-id=42e032");
    return { ...s, sdp: sdp };
  }
  async onMessage(message: any): Promise<void> {
    const mapData = message;
    const data = mapData["data"];

    switch (mapData["type"]) {
      case "error":
        if (!this.isErrorTriggered) {
          this.onCallStateChange?.(
            new Session({ sid: "123", pid: "8428" }),
            CallState.CallPeerNotFound
          );
          this.isErrorTriggered = false;
        }
        // Log and terminate further processing
        console.log("Peer not found for offer with session ID");
        break;
      case "peers":
        {
          const peers: any[] = data;
          if (this.onPeersUpdate) {
            const event: Record<string, any> = {};
            event["self"] = this._selfId;
            event["peers"] = peers;
            this.onPeersUpdate(event);
          }
        }
        break;
      case "offer":
        {
          const {
            from: peerId,
            description,
            media,
            session_id: sessionId,
          } = data;
          const session = this._sessions[sessionId];
          const newSession = await this._createSession(
            session,
            peerId,
            sessionId,
            media
          );
          this._sessions[sessionId] = newSession;
          await newSession.pc?.setRemoteDescription(
            new RTCSessionDescription(description)
          );

          if (newSession.remoteCandidates.length > 0) {
            for (const candidate of newSession.remoteCandidates) {
              await newSession.pc?.addIceCandidate(candidate);
            }
            newSession.remoteCandidates = [];
          }
          this.onCallStateChange?.(newSession, CallState.CallStateNew);
          this.onCallStateChange?.(newSession, CallState.CallStateRinging);
        }
        break;
      case "answer":
        {
          const { description, session_id: sessionId } = data;
          const session = this._sessions[sessionId];
          if (session) {
            await session.pc?.setRemoteDescription(
              new RTCSessionDescription(description)
            );
            this.onCallStateChange?.(session, CallState.CallStateConnected);
          }
        }
        break;
      case "candidate":
        {
          const {
            from: peerId,
            candidate: candidateMap,
            session_id: sessionId,
          } = data;
          const session = this._sessions[sessionId];
          const candidate = new RTCIceCandidate({
            candidate: candidateMap.candidate,
            sdpMid: candidateMap["sdpMid"],
            sdpMLineIndex: candidateMap["sdpMLineIndex"],
          });
          if (session) {
            if (session.pc) {
              await session.pc.addIceCandidate(candidate);
            } else {
              session.remoteCandidates.push(candidate);
            }
          } else {
            this._sessions[sessionId] = new Session({
              pid: peerId,
              sid: sessionId,
            });
            this._sessions[sessionId].remoteCandidates.push(candidate);
          }
        }
        break;
      case "leave":
        {
          const peerId = data as string;
          this._closeSessionByPeerId(peerId);
        }
        break;
      case "bye":
        {
          const sessionId = data["session_id"];
          console.log("bye: " + sessionId);
          const session = this._sessions[sessionId];
          if (session) {
            this.onCallStateChange?.(session, CallState.CallStateBye);
            this._closeSession(session);
          }
        }
        break;
      case "keepalive":
        {
          console.log("keepalive response!");
        }
        break;
      default:
        break;
    }
  }

  async _createOffer(session: Session, media: string): Promise<void> {
    // try {
    const sdpConstraints: RTCOfferOptions = {};
    await session.pc?.createOffer(sdpConstraints).then(async (value) => {
      console.log("Offer", value);
      await session.pc?.setLocalDescription(value).then(() => {
        console.log("Offer Data", {
          to: session.pid,
          from: this._selfId,
          description: value,
          session_id: session.sid,
          media: media,
        });
        Signaling._send("offer", {
          to: session.pid,
          from: this._selfId,
          description: value,
          session_id: session.sid,
          media: media,
        });
      });
    });
    // } catch (error) {
    //   console.error("Error creating offer:", error);
    // }
  }
  public async _createAnswer(session: Session, media: string): Promise<void> {
    try {
      const sessionDescription: RTCSessionDescriptionInit | undefined =
        media === "data"
          ? { type: "answer", sdp: "" } // Create empty SDP for data channel
          : await session.pc?.createAnswer(); // Create answer SDP
      if (!sessionDescription) return;
      await session.pc?.setLocalDescription(sessionDescription as any); // Set local description with fixed SDP

      Signaling._send("answer", {
        to: session.pid,
        from: this._selfId,
        description: sessionDescription,
        session_id: session.sid,
      });
    } catch (e: any) {
      console.log(e.toString());
    }
  }

  public async _cleanSessions(): Promise<void> {
    if (this._localStream) {
      this._localStream.getTracks().forEach(async (track) => {
        track.stop();
      });
      this._localStream = null;
    }
    Object.values(this._sessions).forEach(async (session) => {
      session.pc?.close();
    });
    this._sessions = {};
    this._remoteStreams = [];
    this._senders = [];
    this._videoSource = VideoSource.Camera;
  }
  public async _closeSession(session: Session): Promise<void> {
    console.log("Session to Close:", session);

    if (this._localStream) {
      this._localStream.getTracks().forEach(async (track) => {
        track.stop();
        console.log("Track Gonna end");
      });

      this._localStream = null;
    }

    session.pc?.close();
    this._senders = [];
    this._videoSource = VideoSource.Camera;
  }

  public _closeSessionByPeerId(peerId: string): void {
    let session: Session | undefined;
    this._sessions = Object.fromEntries(
      Object.entries(this._sessions).filter(([key, sess]) => {
        const [id1, id2] = key.split("-");
        if (peerId === id1 || peerId === id2) {
          session = sess;
          return false;
        }
        return true;
      })
    );
    if (session) {
      this._closeSession(session);
      this.onCallStateChange?.(session, CallState.CallStateBye);
    }
  }
}

export {
  Signaling,
  SignalingState,
  CallState,
  VideoSource,
  //   SessionOptions,
  SignalingOptions,
};
