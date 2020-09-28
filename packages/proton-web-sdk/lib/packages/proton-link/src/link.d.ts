import * as esr from '@protonprotocol/proton-signing-request';
import { ApiInterfaces, JsonRpc } from 'eosjs';
import { LinkOptions } from './link-options';
import { LinkSession } from './link-session';
import { LinkStorage } from './link-storage';
import { LinkTransport } from './link-transport';
/** EOSIO permission level with actor and signer, a.k.a. 'auth', 'authority' or 'account auth' */
export declare type PermissionLevel = esr.abi.PermissionLevel;
/**
 * Payload accepted by the [[Link.transact]] method.
 * Note that one of `action`, `actions` or `transaction` must be set.
 */
export interface TransactArgs {
    /** Full transaction to sign. */
    transaction?: esr.abi.Transaction;
    /** Action to sign. */
    action?: esr.abi.Action;
    /** Actions to sign. */
    actions?: esr.abi.Action[];
}
/**
 * Options for the [[Link.transact]] method.
 */
export interface TransactOptions {
    /**
     * Whether to broadcast the transaction or just return the signature.
     * Defaults to true.
     */
    broadcast?: boolean;
}
/**
 * The result of a [[Link.transact]] call.
 */
export interface TransactResult {
    /** The signing request that was sent. */
    request: esr.SigningRequest;
    /** The transaction signatures. */
    signatures: string[];
    /** The callback payload. */
    payload: esr.CallbackPayload;
    /** The signer authority. */
    signer: PermissionLevel;
    /** The resulting transaction. */
    transaction: esr.abi.Transaction;
    /** Serialized version of transaction. */
    serializedTransaction: Uint8Array;
    /** Push transaction response from api node, only present if transaction was broadcast. */
    processed?: {
        [key: string]: any;
    };
}
/**
 * The result of a [[Link.identify]] call.
 */
export interface IdentifyResult extends TransactResult {
    /** The identified account. */
    account: object;
    /** The public key that signed the identity proof.  */
    signerKey: string;
}
/**
 * The result of a [[Link.login]] call.
 */
export interface LoginResult extends IdentifyResult {
    /** The session created by the login. */
    session: LinkSession;
}
/**
 * Main class, also exposed as the default export of the library.
 *
 * Example:
 *
 * ```ts
 * import AnchorLink from 'anchor-link'
 * import ConsoleTransport from 'anchor-link-console-transport'
 *
 * const link = new AnchorLink({
 *     transport: new ConsoleTransport()
 * })
 *
 * const result = await link.transact({actions: myActions})
 * ```
 */
export declare class Link implements esr.AbiProvider {
    /** The eosjs RPC instance used to communicate with the EOSIO node. */
    readonly rpc: JsonRpc;
    /** Transport used to deliver requests to the user wallet. */
    readonly transport: LinkTransport;
    /** EOSIO ChainID for which requests are valid. */
    readonly chainId: string;
    /** Storage adapter used to persist sessions. */
    readonly storage?: LinkStorage;
    private serviceAddress;
    private requestOptions;
    private abiCache;
    private pendingAbis;
    /** Create a new link instance. */
    constructor(options: LinkOptions);
    /**
     * Fetch the ABI for given account, cached.
     * @internal
     */
    getAbi(account: string): Promise<any>;
    /**
     * Create a new unique buoy callback url.
     * @internal
     */
    createCallbackUrl(): string;
    /**
     * Create a SigningRequest instance configured for this link.
     * @internal
     */
    createRequest(args: esr.SigningRequestCreateArguments, transport?: LinkTransport): Promise<esr.SigningRequest>;
    /**
     * Send a SigningRequest instance using this link.
     * @internal
     */
    sendRequest(request: esr.SigningRequest, transport?: LinkTransport, broadcast?: boolean): Promise<TransactResult>;
    /**
     * Sign and optionally broadcast a EOSIO transaction, action or actions.
     *
     * Example:
     *
     * ```ts
     * let result = await myLink.transact({transaction: myTx})
     * ```
     *
     * @param args The action, actions or transaction to use.
     * @param options Options for this transact call.
     * @param transport Transport override, for internal use.
     */
    transact(args: TransactArgs, options?: TransactOptions, transport?: LinkTransport): Promise<TransactResult>;
    /**
     * Send an identity request and verify the identity proof.
     * @param requestPermission Optional request permission if the request is for a specific account or permission.
     * @param info Metadata to add to the request.
     * @note This is for advanced use-cases, you probably want to use [[Link.login]] instead.
     */
    identify(requestPermission?: PermissionLevel, info?: {
        [key: string]: string | Uint8Array;
    }): Promise<IdentifyResult>;
    /**
     * Login and create a persistent session.
     * @param identifier The session identifier, an EOSIO name (`[a-z1-5]{1,12}`).
     *                   Should be set to the contract account if applicable.
     */
    login(identifier: string): Promise<LoginResult>;
    /**
     * Restore previous session, see [[Link.login]] to create a new session.
     * @param identifier The session identifier, should be same as what was used when creating the session with [[Link.login]].
     * @param auth A specific session auth to restore, if omitted the most recently used session will be restored.
     * @returns A [[LinkSession]] instance or null if no session can be found.
     * @throws If no [[LinkStorage]] adapter is configured or there was an error retrieving the session data.
     **/
    restoreSession(identifier: string, auth?: PermissionLevel): Promise<LinkSession | null>;
    /**
     * List stored session auths for given identifier.
     * The most recently used session is at the top (index 0).
     * @throws If no [[LinkStorage]] adapter is configured or there was an error retrieving the session list.
     **/
    listSessions(identifier: string): Promise<esr.abi.PermissionLevel[]>;
    /**
     * Remove stored session for given identifier and auth.
     * @throws If no [[LinkStorage]] adapter is configured or there was an error removing the session data.
     */
    removeSession(identifier: string, auth: PermissionLevel): Promise<void>;
    /**
     * Remove all stored sessions for given identifier.
     * @throws If no [[LinkStorage]] adapter is configured or there was an error removing the session data.
     */
    clearSessions(identifier: string): Promise<void>;
    /**
     * Create an eosjs compatible signature provider using this link.
     * @param availableKeys Keys the created provider will claim to be able to sign for.
     * @param transport (internal) Transport override for this call.
     * @note We don't know what keys are available so those have to be provided,
     *       to avoid this use [[LinkSession.makeSignatureProvider]] instead. Sessions can be created with [[Link.login]].
     */
    makeSignatureProvider(availableKeys: string[], transport?: LinkTransport): ApiInterfaces.SignatureProvider;
    /**
     * Create an eosjs authority provider using this link.
     * @note Uses the configured RPC Node's `/v1/chain/get_required_keys` API to resolve keys.
     */
    makeAuthorityProvider(): ApiInterfaces.AuthorityProvider;
    /** Makes sure session is in storage list of sessions and moves it to top (most recently used). */
    private touchSession;
    /** Makes sure session is in storage list of sessions and moves it to top (most recently used). */
    private storeSession;
    /** Session storage key for identifier and suffix. */
    private sessionKey;
}