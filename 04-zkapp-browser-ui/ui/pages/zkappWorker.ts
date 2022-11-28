import {
    Mina,
    isReady,
    PublicKey,
    PrivateKey,
    Field,
    fetchAccount,
    MerkleWitness
  } from 'snarkyjs'
  
  type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;
  
  // ---------------------------------------------------------------------------------------
  
//   import type { Add } from '../../contracts/src/Add';
  // import type {ClaimAccountV2} from '../../contracts/src/ClaimAccountV2';
  import {YKProof} from '../../contracts/src/YKProof';

import { Account, Answer, ClaimAccountMerkleWitness, AnswerMerkleWitness } from '../../../quiz-app/src/Classes.js';
let MyMerkleWitness = MerkleWitness(8);

  const state = {
    YKProof: null as null | typeof YKProof,
    zkapp: null as null | YKProof,
    transaction: null as null | Transaction
  }
  
  // ---------------------------------------------------------------------------------------
  

  const functions = {
    loadSnarkyJS: async (args: {}) => {
      await isReady;
      console.log("YKProof");
    },
    setActiveInstanceToBerkeley: async (args: {}) => {
      const Berkeley = Mina.BerkeleyQANet(
        "https://proxy.berkeley.minaexplorer.com/graphql"
      );
      Mina.setActiveInstance(Berkeley);
    },
    loadContract: async (args: {}) => {
      const { YKProof } = await import('../../contracts/build/src/YKProof.js');
      state.YKProof = YKProof;
    },
    compileContract: async (args: {}) => {
      await state.YKProof!.compile();
    },
    fetchAccount: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      return await fetchAccount({ publicKey });
    },
    initZkappInstance: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      state.zkapp = new state.YKProof!(publicKey);
    },
    getNum: async (args: {}) => {
      const currentNum = await state.zkapp!.quizAnswerCommittment.get();
      return JSON.stringify(currentNum.toJSON());
    },
    getNumRaw: async (args: {}) => {
      const currentNum = await state.zkapp!.quizAnswerCommittment.get();
      return currentNum;
    },
    createUpdateTransaction: async (args: {account: Account, path: ClaimAccountMerkleWitness}) => {
      const transaction = await Mina.transaction(() => {
          state.zkapp!.createAccount(args.account, args.path);
        }
      );
      state.transaction = transaction;
    },
    createValidateQuestionTransaction: async (args: {response: Field, path: AnswerMerkleWitness}) => {
      
      const transaction = await Mina.transaction(() => {
          state.zkapp!.validateQuestionResponse(args.response, args.path);
        }
      );
      state.transaction = transaction;
    },
    signUpdateTransaction: async (args: {zkappKey: PrivateKey[]}) => {
      await state.transaction!.sign(args.zkappKey);
    },
    proveUpdateTransaction: async (args: {}) => {
      await state.transaction!.prove();
    },
    getTransactionJSON: async (args: {}) => {
      return state.transaction!.toJSON();
    }
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