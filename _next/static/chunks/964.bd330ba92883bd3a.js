"use strict";
(self["webpackChunk_N_E"] = self["webpackChunk_N_E"] || []).push([[964],{

/***/ 964:
/***/ (function(__webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.a(__webpack_module__, async function (__webpack_handle_async_dependencies__, __webpack_async_result__) { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "YKProof": function() { return /* binding */ YKProof; }
/* harmony export */ });
/* harmony import */ var snarkyjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(6400);
/* harmony import */ var _curriculum_curriculum_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(7619);
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (undefined && undefined.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
/**
 * Consolidation of all Smart Contracts for the purpose of deploying to one address
 * Includes {QuizV2, QuizToken, UserAccount, ClaimAccount}
 */


await snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .isReady */ .DK; //comment this when deploying to berkeley, uncomment when running locally
let initialBalance = 100000000000;
class MyMerkleWitness extends (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .MerkleWitness */ .Pj)(8) {
}
const answerTree = new snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .MerkleTree */ .MV(8);
class ClaimAccountMerkleWitness extends (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .MerkleWitness */ .Pj)(8) {
}
const claimAccountTree = new snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .MerkleTree */ .MV(8);
class Answer extends snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .CircuitValue */ .wA {
    constructor(answer) {
        super(answer);
        this.answer = answer;
    }
    hash() {
        return snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash(this.toFields());
    }
}
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .prop */ .vg,
    __metadata("design:type", snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt32 */ .xH)
], Answer.prototype, "answer", void 0);
class Account extends snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .CircuitValue */ .wA {
    constructor(username, password, claimed) {
        super(username, password, claimed);
        this.username = username;
        this.password = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash(password.toFields());
        this.claimed = claimed;
    }
    hash() {
        return snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash(this.toFields());
    }
    setClaimed(claimed) {
        this.claimed = claimed;
    }
}
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .prop */ .vg,
    __metadata("design:type", snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .CircuitString */ ._G)
], Account.prototype, "username", void 0);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .prop */ .vg,
    __metadata("design:type", snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN)
], Account.prototype, "password", void 0);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .prop */ .vg,
    __metadata("design:type", snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN)
], Account.prototype, "claimed", void 0);
class YKProof extends snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .SmartContract */ .C3 {
    constructor() {
        super(...arguments);
        this.commitment = (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .State */ .ZM)();
        this.quizAnswerCommittment = (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .State */ .ZM)();
    }
    // deploy(args: DeployArgs) {
    //   super.deploy(args);
    //   this.setPermissions({
    //     ...Permissions.default(),
    //     editState: Permissions.proofOrSignature(),
    //   });
    //   this.balance.addInPlace(UInt64.from(initialBalance));
    //   this.commitment.set(initialClaimTreeCommittment);
    // }
    deploy(args) {
        super.deploy(args);
        this.setPermissions({
            ...snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Permissions["default"] */ .Pl["default"](),
            editState: snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Permissions.proofOrSignature */ .Pl.proofOrSignature(),
        });
        this.balance.addInPlace(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt64.from */ .zM.from(initialBalance)); //comment this for deployment to berkeley
    }
    validateAccountPassword(account, path) {
        let commitment = this.commitment.get();
        this.commitment.assertEquals(commitment);
        // we check that the response is the same as the hash of the answer at that path
        path.calculateRoot(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash(account.toFields())).assertEquals(commitment);
    }
    createAccount(account, path) {
        let commitment = this.commitment.get();
        this.commitment.assertEquals(commitment);
        // we check that the account is not in the tree
        try {
            path.calculateRoot(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash(account.toFields())).assertEquals(commitment);
        }
        catch (e) {
            //assert failed which is what we expect so now we create the account in the tree
            let newCommitment = path.calculateRoot(account.hash());
            this.commitment.set(newCommitment);
        }
    }
    init() {
        super.init();
        //   this.balance.addInPlace(UInt64.from(initialBalance));
        this.commitment.set(this.createClaimAccountMerkleTree());
        this.quizAnswerCommittment.set(this.createMerkleTree());
    }
    createClaimAccountMerkleTree() {
        let committment = (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN)(0);
        let username = "alysia";
        let account = new Account(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .CircuitString.fromString */ ._G.fromString(username), snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .CircuitString.fromString */ ._G.fromString("minarocks"), (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN)(false));
        claimAccountTree.setLeaf(BigInt(0), account.hash());
        // now that we got our accounts set up, we need the commitment to deploy our contract!
        committment = claimAccountTree.getRoot();
        return committment;
    }
    createMerkleTree() {
        let committment = (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN)(0);
        let Answers = new Map();
        for (let i in _curriculum_curriculum_js__WEBPACK_IMPORTED_MODULE_1__/* .answers10 */ .mK) {
            let thisAnswer = new Answer(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt32.from */ .xH.from(_curriculum_curriculum_js__WEBPACK_IMPORTED_MODULE_1__/* .answers10 */ .mK[i].answer));
            Answers.set(parseInt(i), thisAnswer);
            answerTree.setLeaf(BigInt(i), thisAnswer.hash());
        }
        // now that we got our accounts set up, we need the commitment to deploy our contract!
        committment = answerTree.getRoot();
        return committment;
    }
    validateQuestionResponse(response, path) {
        let quizAnswerCommittment = this.quizAnswerCommittment.get();
        this.quizAnswerCommittment.assertEquals(quizAnswerCommittment);
        // we check that the response is the same as the hash of the answer at that path
        path.calculateRoot(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Poseidon.hash */ .jm.hash(response.toFields())).assertEquals(quizAnswerCommittment);
    }
    // QUiz TOken
    tokenDeploy(deployer, verificationKey) {
        let address = deployer.toPublicKey();
        let tokenId = this.token.id;
        let deployUpdate = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Experimental.createChildAccountUpdate */ .Hw.createChildAccountUpdate(this.self, address, tokenId);
        snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .AccountUpdate.setValue */ .nx.setValue(deployUpdate.update.permissions, {
            ...snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Permissions["default"] */ .Pl["default"](),
            send: snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Permissions.proof */ .Pl.proof(),
        });
        snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .AccountUpdate.setValue */ .nx.setValue(deployUpdate.update.verificationKey, verificationKey);
        deployUpdate.sign(deployer);
    }
    mint(receiverAddress) {
        let amount = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt64.from */ .zM.from(1000000);
        this.token.mint({ address: receiverAddress, amount });
    }
    burn(receiverAddress) {
        let amount = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt64.from */ .zM.from(1000);
        this.token.burn({ address: receiverAddress, amount });
    }
    sendTokens(senderAddress, receiverAddress, callback) {
        let senderAccountUpdate = this.approve(callback, snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .AccountUpdate.Layout.AnyChildren */ .nx.Layout.AnyChildren);
        let amount = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt64.from */ .zM.from(1000);
        let negativeAmount = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Int64.fromObject */ .ni.fromObject(senderAccountUpdate.body.balanceChange);
        negativeAmount.assertEquals(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Int64.from */ .ni.from(amount).neg());
        let tokenId = this.token.id;
        senderAccountUpdate.body.tokenId.assertEquals(tokenId);
        senderAccountUpdate.body.publicKey.assertEquals(senderAddress);
        let receiverAccountUpdate = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Experimental.createChildAccountUpdate */ .Hw.createChildAccountUpdate(this.self, receiverAddress, tokenId);
        receiverAccountUpdate.balance.addInPlace(amount);
    }
    //UserAccount
    approveSend() {
        let amount = snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .UInt64.from */ .zM.from(1000);
        this.balance.subInPlace(amount);
    }
}
__decorate([
    (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .state */ .SB)(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN),
    __metadata("design:type", Object)
], YKProof.prototype, "commitment", void 0);
__decorate([
    (0,snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .state */ .SB)(snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN),
    __metadata("design:type", Object)
], YKProof.prototype, "quizAnswerCommittment", void 0);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Account, ClaimAccountMerkleWitness]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "validateAccountPassword", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Account, ClaimAccountMerkleWitness]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "createAccount", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Field */ .gN, MyMerkleWitness]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "validateQuestionResponse", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .PrivateKey */ ._q, snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .VerificationKey */ .Wh]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "tokenDeploy", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "mint", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "burn", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh,
        snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .PublicKey */ .nh, snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .Experimental.Callback */ .Hw.Callback]),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "sendTokens", null);
__decorate([
    snarkyjs__WEBPACK_IMPORTED_MODULE_0__/* .method */ .UD,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], YKProof.prototype, "approveSend", null);

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } }, 1);

/***/ }),

/***/ 7619:
/***/ (function(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "mK": function() { return /* reexport */ answers10_namespaceObject; }
});

// UNUSED EXPORTS: answers, questions, questions10, questionsRadio

;// CONCATENATED MODULE: ../../quiz-app/build/src/contracts/curriculum/questions.json
var questions_namespaceObject = [];
;// CONCATENATED MODULE: ../../quiz-app/build/src/contracts/curriculum/questions10.json
var questions10_namespaceObject = [];
;// CONCATENATED MODULE: ../../quiz-app/build/src/contracts/curriculum/questionsRadio.json
var questionsRadio_namespaceObject = [];
;// CONCATENATED MODULE: ../../quiz-app/build/src/contracts/curriculum/answers.json
var answers_namespaceObject = [];
;// CONCATENATED MODULE: ../../quiz-app/build/src/contracts/curriculum/answers10.json
var answers10_namespaceObject = JSON.parse('[{"answer":4},{"answer":1},{"answer":2},{"answer":2},{"answer":3},{"answer":3},{"answer":1},{"answer":4},{"answer":4},{"answer":1}]');
;// CONCATENATED MODULE: ../../quiz-app/build/src/contracts/curriculum/curriculum.js








/***/ })

}]);