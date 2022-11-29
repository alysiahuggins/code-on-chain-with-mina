import {
    fetchAccount,
    PublicKey,
    PrivateKey,
    Field,
    CircuitString,
    MerkleTree,MerkleWitness
  } from 'snarkyjs'
import { AnswerMerkleWitness, Account, ClaimAccountMerkleWitness } from '../../../quiz-app/src/contracts/Classes.js';
let MyMerkleWitness = MerkleWitness(8);

  
  import type { ZkappWorkerRequest, ZkappWorkerReponse, WorkerFunctions } from './zkappWorker.js';
  
  export default class ZkappWorkerClient {
  
    // ---------------------------------------------------------------------------------------
  
    loadSnarkyJS() {
      return this._call('loadSnarkyJS', {});
    }
  
    setActiveInstanceToBerkeley() {
      return this._call('setActiveInstanceToBerkeley', {});
    }

  
    loadContract() {
      return this._call('loadContract', {});
    }
  
    compileContract() {
      return this._call('compileContract', {});
    }

    loadContract2() {
      return this._call('loadContract2', {});
    }
  
    compileContract2() {
      return this._call('compileContract2', {});
    }
  
    fetchAccount({ publicKey }: { publicKey: PublicKey }): ReturnType<typeof fetchAccount> {
      const result = this._call('fetchAccount', { publicKey58: publicKey.toBase58() });
      return (result as ReturnType<typeof fetchAccount>);
    }
  
    initZkappInstance(publicKey: PublicKey) {
      return this._call('initZkappInstance', { publicKey58: publicKey.toBase58() });
    }

    initZkappInstance2(publicKey: PublicKey) {
      return this._call('initZkappInstance2', { publicKey58: publicKey.toBase58() });
    }
  
    async getNum(): Promise<Field> {
      const result = await this._call('getNum', {});
      return Field.fromJSON(JSON.parse(result as string));
    }

    async getNum2(): Promise<Field> {
      const result = await this._call('getNum2', {});
      return Field.fromJSON(JSON.parse(result as string));
    }

    async getNumRaw(): Promise<Field[]> {
      const result = await this._call('getNumRaw', {})!;
      return result as Field[];
    }

  
    createUpdateTransaction(account: Account, path: ClaimAccountMerkleWitness) {
      return this._call('createUpdateTransaction', {});
    }

    createUpdateTransaction2() {
      return this._call('createUpdateTransaction2', {});
    }

    createValidateQuestionTransaction(response: Field, path:AnswerMerkleWitness) {
      return this._call('createValidateQuestionTransaction', { response, path});
    }

    validateQuestionTransaction(response: Field, path:AnswerMerkleWitness) {
      return this._call('validateQuestionTransaction', { response, path});
    }
  
    signUpdateTransaction(zkappKey: PrivateKey[]) {
      return this._call('proveUpdateTransaction', {zkappKey});
    }

    proveUpdateTransaction() {
      return this._call('proveUpdateTransaction', {});
    }
  
    async getTransactionJSON() {
      const result = await this._call('getTransactionJSON', {});
      return result;
    }

    async createAnswerMerkleTree() {
      const result = await this._call('createAnswerMerkleTree', {});
      return result as MerkleTree;
    }
  
    // ---------------------------------------------------------------------------------------
  
    worker: Worker;
  
    promises: { [id: number]: { resolve: (res: any) => void, reject: (err: any) => void } };
  
    nextId: number;
  
    constructor() {
      this.worker = new Worker(new URL('./zkappWorker.ts', import.meta.url))
      this.promises = {};
      this.nextId = 0;
  
      this.worker.onmessage = (event: MessageEvent<ZkappWorkerReponse>) => {
        this.promises[event.data.id].resolve(event.data.data);
        delete this.promises[event.data.id];
      };
    }
  
    _call(fn: WorkerFunctions, args: any) {
      return new Promise((resolve, reject) => {
        this.promises[this.nextId] = { resolve, reject }
  
        const message: ZkappWorkerRequest = {
          id: this.nextId,
          fn,
          args,
        };
  
        this.worker.postMessage(message);
  
        this.nextId++;
      });
    }
  }
  