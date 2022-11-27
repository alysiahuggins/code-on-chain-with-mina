import {
    Mina,
    isReady,
    PublicKey,
    PrivateKey,
    Field,
    fetchAccount,
  } from 'snarkyjs'
import { Account, ClaimAccountMerkleWitness } from '../../../quiz-app/src/Classes.js';
  
  type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
  
  // ---------------------------------------------------------------------------------------
  
//   import type { Add } from '../../contracts/src/Add';
  import type {ClaimAccountV2} from '../../contracts/src/ClaimAccountV2';
  const state = {
    ClaimAccountV2: null as null | typeof ClaimAccountV2,
    zkapp: null as null | ClaimAccountV2,
    transaction: null as null | Transaction,
  }
  
  // ---------------------------------------------------------------------------------------
  

  const functions = {
    loadSnarkyJS: async (args: {}) => {
      await isReady;
      console.log("CLaimAcccountV2");

    },
    setActiveInstanceToBerkeley: async (args: {}) => {
      const Berkeley = Mina.BerkeleyQANet(
        "https://proxy.berkeley.minaexplorer.com/graphql"
      );
      Mina.setActiveInstance(Berkeley);
    },
    setActiveInstanceToLocal: async (args: {}) => {
      const Local = Mina.LocalBlockchain({ proofsEnabled: true });
      Mina.setActiveInstance(Local);
    },
    loadContract: async (args: {}) => {
      const { ClaimAccountV2 } = await import('../../contracts/build/src/ClaimAccountV2.js');
      state.ClaimAccountV2 = ClaimAccountV2;
    },
    compileContract: async (args: {}) => {
      await state.ClaimAccountV2!.compile();
    },
    fetchAccount: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      return await fetchAccount({ publicKey });
    },
    initZkappInstance: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      state.zkapp = new state.ClaimAccountV2!(publicKey);
    },
    getNum: async (args: {}) => {
      const currentNum = await state.zkapp!.commitment.get();
      return JSON.stringify(currentNum.toJSON());
    },
    createUpdateTransaction: async (args: {account: Account, path: ClaimAccountMerkleWitness}) => {
      const transaction = await Mina.transaction(() => {
          state.zkapp!.createAccount(args.account, args.path);
        }
      );
      state.transaction = transaction;
    },
    proveUpdateTransaction: async (args: {}) => {
      await state.transaction!.prove();
    },
    getTransactionJSON: async (args: {}) => {
      return state.transaction!.toJSON();
    },
  };
  
  // ---------------------------------------------------------------------------------------
  
  export type WorkerFunctions = keyof typeof functions;
  
  export type ZkappWorkerRequest = {
    id: number,
    fn: WorkerFunctions,
    args: any
  }
  
  export type ZkappWorkerReponse = {
    id: number,
    data: any
  }
  if (process.browser) {
    addEventListener('message', async (event: MessageEvent<ZkappWorkerRequest>) => {
      const returnData = await functions[event.data.fn](event.data.args);
  
      const message: ZkappWorkerReponse = {
        id: event.data.id,
        data: returnData,
      }
      postMessage(message)
    });
  }