// Constants defined in the Discv5
// In Bytes

export namespace DISCV5Constants {
    // Maximum encoded size of a node record
    export const MAX_RECORD_SIZE: number = 300;

    // Size of a ENR sequence
    export const SEQUENCE_SIZE: number = 8;

    // Maximum size of a packet
    export const PACKET_SIZE = 1280;

    // Max length of a tag in a packet
    export const TAG_LENGTH = 32;

    // Max length of an authentication tag
    export const AUTH_TAG_LENGTH = 12;

    // Max length of magic token
    export const MAGIC_LENGTH = 32;

    // Max length of nonce
    export const ID_NONCE_LENGTH = 32;

    // Min length of a NODES message
    export const NODES_MSG_LENGTH = 4800;

    // Timeout for 1 request/response communication in milliseconds
    export const RQRS_TIMEOUT = 500;

    // Timeout for handshake in milliseconds
    export const HANDSHAKE_TIMEOUT = 1000;

    // Length of a Node ID
    export const NODE_ID_LENGTH = 32;

    // Length of info tag
    export const INFO_LENGTH = 26 + 2 * NODE_ID_LENGTH;

    // Length of key
    export const KEY_LENGTH = 16;
}
