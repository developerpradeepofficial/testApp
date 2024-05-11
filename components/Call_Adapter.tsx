import { useEffect, useRef } from "react";
import { CallState, Session, Signaling } from "./signalling";

export interface CallAdapterOptions {
  inmateId: string;
  onLocalStreamAvailable?: (stream: any) => void;
  onPeerStreamAvailable?: (stream: any) => void;
  getCombinedMediaStream?: (stream: any) => void;
  localRef?: React.RefObject<HTMLVideoElement>;
  peerRef?: React.RefObject<HTMLVideoElement>;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  downloadVideo?: boolean;
  recordVideo?: boolean;
  hostURL: string;
}

export class CallAdapter {
  private static signaling: Signaling;
  private session?: Session;
  private localStream: any;
  private peerStream: any;

  private callStartTime?: number;
  private callEndTime?: number;
  private mediaRecorder?: MediaRecorder;
  private recordedChunks: Blob[] = [];
  private recordedVideo?: Blob;
  private downloadVideo: boolean = false;
  private recordVideo: boolean = false;
  public onStateChange?: (callState: CallState) => unknown;
  private callType?: string;
  private canvasRef: React.RefObject<HTMLCanvasElement> | undefined;
  constructor(private options: CallAdapterOptions) {
    CallAdapter.signaling = new Signaling({
      host: options.hostURL,
      selfId: options.inmateId,
    });
    this.canvasRef = options.canvasRef;
    this.downloadVideo = options.downloadVideo ? options.downloadVideo : false;
    this.recordVideo = options.recordVideo ? options.recordVideo : false;
  }
  async connect() {
    await CallAdapter.signaling.connect();
    this.setState(CallState.Idle);

    CallAdapter.signaling.onPeersUpdate = (event) => {
      console.log("Peer Update: ", event);
    };
    CallAdapter.signaling.onLocalStream = (stream) => {
      console.log("Local Stream", stream);
      this.localStream = stream;
      if (this.options.onLocalStreamAvailable) {
        this.options.onLocalStreamAvailable(stream);
      }
    };
    CallAdapter.signaling.onAddRemoteStream = (_, stream) => {
      console.log("Remote Stream", stream);
      this.peerStream = stream;
      if (this.options.onPeerStreamAvailable) {
        this.options.onPeerStreamAvailable(stream);
      }
    };
    CallAdapter.signaling.onCallStateChange =
      this.handleCallStateChange.bind(this);
    this.setState(CallState.Idle);
  }

  async startCall(callTo: string, callType: string) {
    this.callType = callType;
    CallAdapter.signaling.invite(callTo, callType);
  }

  async disconnectCall(): Promise<string | null> {
    if (this.session) {
      CallAdapter.signaling.bye(this.session.sid);
      this.callEndTime = Date.now();

      return this.getDurationFromEpoch(this.getCallDurationFormatted());
    }
    return null;
  }

  async accept() {
    console.log("Answer Clicked", this.session, "video");
    if (this.session?.sid) {
      await CallAdapter.signaling.accept(this.session?.sid, "video");
    }
  }

  async startRecording() {
    const canvas = this.canvasRef?.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx && this.recordVideo) {
      console.log("Call recording started");
      if (this.localStream && this.peerStream) {
        const combinedAudioStream = new MediaStream();
        this.localStream.getAudioTracks().forEach((track: MediaStreamTrack) => {
          combinedAudioStream.addTrack(track);
        });
        this.peerStream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
          combinedAudioStream.addTrack(track);
        });

        const drawFrame = () => {
          ctx.drawImage(
            this.options.peerRef!.current!,
            0,
            0,
            canvas.width / 2,
            canvas.height
          );
          ctx.drawImage(
            this.options.localRef!.current!,
            canvas.width / 2,
            0,
            canvas.width / 2,
            canvas.height
          );

          requestAnimationFrame(drawFrame);
        };

        setTimeout(() => {
          drawFrame();
        }, 5000);
        const combinedVideoStream =
          this.callType == "video"
            ? canvas.captureStream().getVideoTracks()
            : [];
        const combinedMediaStream = new MediaStream([
          ...combinedAudioStream.getAudioTracks(),
          ...combinedVideoStream,
        ]);
        if (this.options.getCombinedMediaStream) {
          this.options.getCombinedMediaStream(combinedMediaStream);
        }
        this.mediaRecorder = new MediaRecorder(combinedMediaStream);
        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks?.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          const recordedBlob = new Blob(this.recordedChunks, {
            type: "video/webm",
          });
          this.setRecordedVideo(recordedBlob);
          if (this.downloadVideo) {
            const url = URL.createObjectURL(recordedBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "recorded_video.webm";
            a.click();
            URL.revokeObjectURL(url);
          }
        };

        this.mediaRecorder.start();
        console.log("Recording", this.mediaRecorder.state);
      }
    }
  }
  private setRecordedVideo(recordedBlob: Blob) {
    this.recordedVideo = recordedBlob;
  }
  getRecordedVideo() {
    return this.recordedVideo;
  }
  stopRecording = () => {
    console.log("Call recording stopped");
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.mediaRecorder = undefined;
    }
  };
  closeConnection() {
    CallAdapter.signaling.close();
  }

  private getCallDurationFormatted(): number | null {
    if (this.callStartTime && this.callEndTime) {
      return this.callEndTime - this.callStartTime;
    }
    return null;
  }

  private getDurationFromEpoch(epoch: number | null): string {
    if (!epoch) return "";
    const epochMilliseconds = epoch * 1000; // Convert seconds to milliseconds
    const now = Date.now(); // Current time in milliseconds
    const durationInMilliseconds = now - epochMilliseconds;
    const durationInSeconds = Math.floor(durationInMilliseconds / 1000);
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = durationInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  private setState(newState: CallState) {
    this.onStateChange?.(newState);
    console.log("CallAdapter state:", newState);
    if (newState === CallState.CallStateConnected) {
      this.callStartTime = Date.now();
      this.startRecording();
    }
    if (newState === CallState.CallStateBye) {
      this.callEndTime = Date.now(); // Set call end time when call ends
    }
  }

  private handleCallStateChange(session: Session, callState: CallState) {
    console.log("Call State: ", callState);
    switch (callState) {
      case CallState.CallStateNew:
        this.session = session;
        this.setState(CallState.CallStateNew);
        console.log("New Call State Created");
        break;
      case CallState.CallPeerNotFound:
        this.setState(CallState.CallPeerNotFound);
        console.log("Peer Not Found");
        break;
      case CallState.CallStateInvite:
        this.setState(CallState.CallStateInvite);
        console.log("Invite");
        break;
      case CallState.CallStateRinging:
        this.setState(CallState.CallStateRinging);
        console.log("Ringing");
        break;
      case CallState.CallStateConnected:
        this.setState(CallState.CallStateConnected);
        console.log("Call Connected");
        break;
      case CallState.CallStateBye:
        this.setState(CallState.CallStateBye);
        this.stopRecording();
        console.log("Call Disconnected!!!");
        break;
      default:
        break;
    }
  }
}

export const useCallAdapter = (
  callAdapterOptions: CallAdapterOptions,
  onStateChange?: (callState: CallState) => unknown
) => {
  const callAdapterRef = useRef<CallAdapter | null>(null);
  useEffect(() => {
    callAdapterRef.current = new CallAdapter(callAdapterOptions);
    callAdapterRef.current.onStateChange = onStateChange;
    callAdapterRef.current.connect();
    console.log("use effect");

    return () => {
      if (callAdapterRef.current) {
        callAdapterRef.current.disconnectCall();
      }
      callAdapterRef.current = null;
    };
  }, []); // Don't Update the Dependency.

  const handleMakeCall = (calleeId: string, callType: string) => {
    if (callAdapterRef.current) {
      callAdapterRef.current.startCall(calleeId, callType);
    }
  };
  const handleEndCall = () => {
    if (callAdapterRef.current) {
      return callAdapterRef.current.disconnectCall();
    }
  };

  return { handleMakeCall, handleEndCall, callAdapterRef };
};
