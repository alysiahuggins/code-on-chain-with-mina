// this map serves as our off-chain in-memory storage
import {
    Field,
    CircuitValue,
    CircuitString,
    prop,
    Poseidon,
    MerkleWitness,
  } from 'snarkyjs';

export class Account extends CircuitValue {
    @prop username: CircuitString;
    @prop password: Field;
    @prop claimed: Field;
  
    constructor(username: CircuitString, password: CircuitString, claimed: Field) {
      super(username, password, claimed);
      this.username = username;
      this.password = Poseidon.hash(password.toFields());
      this.claimed = claimed;
    }
  
    hash(): Field {
      return Poseidon.hash(this.toFields());
    }
  
    setClaimed(claimed: Field) {
      this.claimed = claimed;
    }
  }

export class ClaimAccountMerkleWitness extends MerkleWitness(8) {}
