import React, { useEffect } from "react";

export interface SimpleSocketIOOptions {
  url: string;
  onOpen?: () => void;
  onMessage?: (message: unknown) => void;
  onClose?: (code: number | null, reason: string | null) => void;
}

class SimpleSocketIO {
  private _socket: WebSocket | null = null;
  private _options: SimpleSocketIOOptions;

  constructor(options: SimpleSocketIOOptions) {
    this._options = options;
  }

  connect(): void {
    this._socket = new WebSocket(this._options.url);

    this._socket.onopen = () => {
      console.log("Socket connected");
      if (this._options.onOpen) {
        this._options.onOpen();
      }
    };

    this._socket.onmessage = (event: { data: string }) => {
      // console.log("Received message:", event.data);
      if (this._options.onMessage) {
        this._options.onMessage(JSON.parse(event.data));
      }
    };

    this._socket.onclose = (event: { code: number; reason: string }) => {
      console.log("Socket disconnected:", event.reason);
      if (this._options.onClose) {
        this._options.onClose(event.code, event.reason);
      }
    };
  }

  send(data: any): void {
    if (this._socket) {
      this._socket.send(JSON.stringify(data));
    } else {
      console.warn("Socket not connected. Unable to send data:", data);
    }
  }

  close(): void {
    if (this._socket) {
      this._socket.close();
    }
  }
}

export { SimpleSocketIO };
