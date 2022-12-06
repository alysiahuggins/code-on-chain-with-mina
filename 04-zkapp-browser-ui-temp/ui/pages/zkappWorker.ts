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
  
  import type { Add } from '../../contracts/src/Add';
  // import type {ClaimAccountV2} from '../../contracts/src/ClaimAccountV2';
  import {YKProof} from '../../contracts/src/YKProof';

import { Account, Answer, ClaimAccountMerkleWitness, MyMerkleWitness } from '../../contracts/src/Classes.js';
// let MyMerkleWitness = MerkleWitness(8);

  const state = {
    YKProof: null as null | typeof YKProof,
    zkapp: null as null | YKProof,
    Add: null as null | typeof Add,
    zkapp2: null as null | Add,
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
      // const { YKProof } = await import('../../contracts/build/src/YKProof.js');
      const { YKProof } = await import('../../../quiz-app-ui/contracts/build/src/YKProof.js');
      state.YKProof = YKProof;
    },
    compileContract: async (args: {}) => {
      const verificationkey = await state.YKProof!.compile();
      console.log('verificationkey')
      console.log(verificationkey.verificationKey.hash);
    },
    loadContract2: async (args: {}) => {
      const { Add } = await import('../../contracts/build/src/Add.js');
      state.Add = Add;
    },
    compileContract2: async (args: {}) => {
      await state.Add!.compile();
    },
    fetchAccount: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      return await fetchAccount({ publicKey });
    },
    initZkappInstance: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      state.zkapp = new state.YKProof!(publicKey);
    },
    initZkappInstance2: async (args: { publicKey58: string }) => {
      const publicKey = PublicKey.fromBase58(args.publicKey58);
      state.zkapp2 = new state.Add!(publicKey);
    },
    getNum: async (args: {}) => {
      const currentNum = await state.zkapp!.commitment.get();
      return JSON.stringify(currentNum.toJSON());
    },
    getNum2: async (args: {}) => {
      const currentNum = await state.zkapp2!.num.get();
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
    createUpdateTransaction2: async (args: {}) => {
      const transaction = await Mina.transaction(() => {
          state.zkapp2!.update();
        }
      );
      state.transaction = transaction;
    },
    createValidateQuestionTransaction: async (args: {response: Field, path: MyMerkleWitness}) => {
      
      const transaction = await Mina.transaction(() => {
          state.zkapp!.validateQuestionResponse(args.response, args.path);
        }
      );
      state.transaction = transaction;
    },
    validateQuestionTransaction: async (args: {response: Field, path: MyMerkleWitness, zkappKey: PrivateKey}) => {
      
      const transaction = await Mina.transaction(() => {
          state.zkapp!.validateQuestionResponse(args.response, args.path);
          state.zkapp!.sign(args.zkappKey);
        }
      );
      state.transaction = transaction;
      await state.transaction!.prove();
      return state.transaction!.toJSON();
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