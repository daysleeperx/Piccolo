export namespace OSC {
    /**
     * Open Sound Control Client.
     * https://en.wikipedia.org/wiki/Open_Sound_Control
     */
    export interface ClientConfig {
        host: string;
        port: number;
        path: string;
    }

    export interface Client<Message> {
        /**
         * Send OSC Message. 
         * @param {Message} message OSC Message 
         */
        send(message: Message): void;
    }
}
