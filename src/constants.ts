// Constants defined in the Discv5
// In Bytes

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

// Key agreement string
export const KEY_AGREEMENT_STR = "discovery v5 key agreement";

// Scheme
export const KNOWN_SCHEME = "gcm";

// Who are you string
export const WHOAREYOU_STR = "WHOAREYOU";

// Nonce string
export const NONCE_STR = "discovery-id-nonce";

// Milliseconds before a timeout expires
export const REQUEST_TIMEOUT = 10000;

// Number of times to retry a request
export const REQUEST_RETRIES = 2;

// Timeout for a session in milliseconds
export const SESSION_TIMEOUT = 86400000;

export const ERR_TOO_SMALL = "packet too small";
export const ERR_UNKNOWN_PACKET = "unknown packet";
export const ERR_UNKNOWN_FORMAT = "unknown format";
export const ERR_INVALID_BYTE_SIZE = "invalid byte size";
