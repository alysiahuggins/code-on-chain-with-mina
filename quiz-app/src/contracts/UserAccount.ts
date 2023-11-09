import {
    isReady,
    method,
    SmartContract,
    UInt64,
  } from 'o1js';
  
  await isReady;

export class UserAccount extends SmartContract {
  
    @method approveSend() {
      let amount = UInt64.from(1_000);
      this.balance.subInPlace(amount);
    }
  }