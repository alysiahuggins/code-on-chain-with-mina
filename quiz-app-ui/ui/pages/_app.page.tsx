import '../styles/globals.css'
import { useEffect, useState } from "react";
import './reactCOIServiceWorker';
import { Container, Row, Col, Button, Card, Form, Image, InputGroup } from 'react-bootstrap'
// import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/css/bootstrap.css';

import ZkappWorkerClient from './zkappWorkerClient';

import {
  PublicKey,
  PrivateKey,
  Field,
} from 'snarkyjs'

import {questionsRadio as questionsRadio} from "../../../quiz-app/src/curriculum/curriculum.js";
import {answers as answers} from "../../../quiz-app/src/curriculum/curriculum.js";



let transactionFee = 0.1;
export default function App() {

  let [state, setState] = useState({
    zkappWorkerClient: null as null | ZkappWorkerClient,
    hasWallet: null as null | boolean,
    hasBeenSetup: false,
    accountExists: false,
    currentNum: null as null | Field,
    publicKey: null as null | PublicKey,
    zkappPublicKey: null as null | PublicKey,
    creatingTransaction: false,
  });

  // -------------------------------------------------------
  // Do Setup

  useEffect(() => {
    (async () => {
      if (!state.hasBeenSetup) {
        const zkappWorkerClient = new ZkappWorkerClient();
        
        console.log('Loading SnarkyJS...');
        await zkappWorkerClient.loadSnarkyJS();
        console.log('done');

        await zkappWorkerClient.setActiveInstanceToBerkeley();

        const mina = (window as any).mina;

        if (mina == null) {
          setState({ ...state, hasWallet: false });
          return;
        }

        const publicKeyBase58 : string = (await mina.requestAccounts())[0];
        const publicKey = PublicKey.fromBase58(publicKeyBase58);

        console.log('using key', publicKey.toBase58());

        console.log('checking if account exists...');
        const res = await zkappWorkerClient.fetchAccount({ publicKey: publicKey! });
        const accountExists = res.error == null;

        await zkappWorkerClient.loadContract();

        console.log('compiling zkApp');
        await zkappWorkerClient.compileContract();
        console.log('zkApp compiled');

        // const zkappPublicKey = PublicKey.fromBase58('B62qph2VodgSo5NKn9gZta5BHNxppgZMDUihf1g7mXreL4uPJFXDGDA');
        const zkappPublicKey = PublicKey.fromBase58('B62qkFzjHYDXq5qnFL7Q3Z63H94vUVPprA6HVULkW8rGtowLDeRusEz');


        await zkappWorkerClient.initZkappInstance(zkappPublicKey);

        console.log('getting zkApp state...');
        await zkappWorkerClient.fetchAccount({ publicKey: zkappPublicKey })
        const currentNum = await zkappWorkerClient.getNum();
        console.log('current state:', currentNum.toString());

        setState({ 
            ...state, 
            zkappWorkerClient, 
            hasWallet: true,
            hasBeenSetup: true, 
            publicKey, 
            zkappPublicKey, 
            accountExists, 
            currentNum
        });
      }
    })();
  }, []);

  // -------------------------------------------------------
  // Wait for account to exist, if it didn't

  useEffect(() => {
    (async () => {
      if (state.hasBeenSetup && !state.accountExists) {
        for (;;) {
          console.log('checking if account exists...');
          const res = await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! })
          const accountExists = res.error == null;
          if (accountExists) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
        setState({ ...state, accountExists: true });
      }
    })();
  }, [state.hasBeenSetup]);

  // -------------------------------------------------------
  // Send a transaction

  const onSendTransaction = async (response:number, questionPosition:number) => {
    setState({ ...state, creatingTransaction: true });
    console.log('sending a transaction...');

    await state.zkappWorkerClient!.fetchAccount({ publicKey: state.publicKey! });

    await state.zkappWorkerClient!.createUpdateTransaction(response, questionPosition);

    console.log('creating proof...');
    await state.zkappWorkerClient!.proveUpdateTransaction();

    console.log('getting Transaction JSON...');
    const transactionJSON = await state.zkappWorkerClient!.getTransactionJSON()
    console.log(transactionJSON);
    console.log('requesting send transaction...');
    const { hash } = await (window as any).mina.sendTransaction({
      transaction: transactionJSON,
      feePayer: {
        fee: transactionFee,
        memo: '',
      },
    });

    console.log(
      'See transaction at https://berkeley.minaexplorer.com/transaction/' + hash
    );

    setState({ ...state, creatingTransaction: false });
  }

  
  // -------------------------------------------------------
  // Refresh the current state

  const onRefreshCurrentNum = async () => {
    console.log('getting zkApp state...');
    await state.zkappWorkerClient!.fetchAccount({ publicKey: state.zkappPublicKey! })
    const currentNum = await state.zkappWorkerClient!.getNum();
    console.log('current state:', currentNum.toString());

    setState({ ...state, currentNum });
  }

  // -------------------------------------------------------
  // Other Methods
  const [item, setItem] = useState({ quizOption: "", another: "another" });

  const { quizOption: questionResponse } = item;


  const handleChange = e => {
    e.persist();
    console.log(e.target.value);

    setItem(prevState => ({
      ...prevState,
      quizOption: e.target.value
    }));
  };

  const  handleSubmit = async (e) => {
    e.preventDefault();
    alert(`${questionResponse}`);
    let formID = e.target.id;
    let questionNumber = formID.split('-')[1];
    let response = parseInt(questionResponse)+1;
    console.log(`${response} was the response to ${questionNumber}`);
    await onSendTransaction(response,questionNumber);

    // let w = state.answerTree!.getWitness(BigInt(0));
    // let witness = new MyMerkleWitness(w);
    // onAnswerTransaction(Field(4), witness);
    // onTransaction();
  };

  // -------------------------------------------------------
  // Create UI elements

  let hasWallet;
  if (state.hasWallet != null && !state.hasWallet) {
    const auroLink = 'https://www.aurowallet.com/';
    const auroLinkElem = <a href={auroLink} target="_blank" rel="noreferrer"> [Link] </a>
    hasWallet = <div> Could not find a wallet. Install Auro wallet here: { auroLinkElem }</div> 
  }

  let setupText = state.hasBeenSetup ? '' : 'Loading App...';
  // let setup = <div> { setupText } { hasWallet }</div>
  let setup = <Container className="text-center"> { setupText } { hasWallet }</Container>
  let logoContent = 
  <Container fluid="sm" className="text-center">
    <Row>
      <Col>
      <Card.Img src='/images/ykp-logo.png'   alt="logo"/>
      </Col>
    </Row>
  </Container>

  let accountDoesNotExist;
  if (state.hasBeenSetup && !state.accountExists) {
    const faucetLink = "https://faucet.minaprotocol.com/?address=" + state.publicKey!.toBase58();
    accountDoesNotExist = <Container>
      Account does not exist. Please visit the faucet to fund this account
      <a href={faucetLink} target="_blank" rel="noreferrer"> [Link] </a>
    </Container>
  }

  let mainContent, quizContent;
  if (state.hasBeenSetup && state.accountExists) {
    mainContent = 
    // <div>
    //   <button onClick={() => onSendTransaction(4,0)} /*disabled={state.creatingTransaction}*/> Send Transaction </button>
    //   <div> Current Number in zkApp: { state.currentNum!.toString() } </div>
    //   <button onClick={onRefreshCurrentNum}> Get Latest State </button>
    // </div>

    <Container fluid="sm" className="text-center">
    <Row>
      <Col></Col>
      <Col>
        <Button onClick={() => onSendTransaction(4,0)} /*disabled={state.creatingTransaction}*/> Send Transaction </Button>
        <div> Current Number in zkApp: { state.currentNum!.toString() } </div>
        <Button onClick={onRefreshCurrentNum}> Get Latest State </Button>
      </Col>
      <Col></Col>
    </Row>
    </Container>;

    quizContent = 
      <Container fluid="sm" className="text-center">
        <Row>
          <Col>
            <Form>
            <h3>{questionsRadio[0].question}</h3>
            <InputGroup>
            {/* {['checkbox', 'radio'].map((type) => (
          <div key={`default-${type}`} className="mb-3">
            <InputGroup.Radio
              type="radio"
              id={`default-${type}`}
              label={`default ${type}`}
            />
            <InputGroup.Radio aria-label="Radio button for following text input" />
          </div>
        ))} */}
        </InputGroup>
          </Form>
          <Form id="form-0" onSubmit={handleSubmit}>
          <Form.Group controlId="quizOption">
            <Form.Check
              value="0"
              type="radio"
              aria-label="radio 1"
              label={questionsRadio[0].options[0]}
              onChange={handleChange}
              checked={questionResponse === "0"}
            />
            <Form.Check
              value="1"
              type="radio"
              aria-label="radio 2"
              label={questionsRadio[0].options[1]}
              onChange={handleChange}
              checked={questionResponse === "1"}
            />

          <Form.Check
              value="2"
              type="radio"
              aria-label="radio 2"
              label={questionsRadio[0].options[2]}
              onChange={handleChange}
              checked={questionResponse === "2"}
            />
            <Form.Check
              value="3"
              type="radio"
              aria-label="radio 2"
              label={questionsRadio[0].options[3]}
              onChange={handleChange}
              checked={questionResponse === "3"}
            />
          </Form.Group>
          <Button variant="primary" type="submit" >
            Submit
          </Button>
        </Form>
          
        
          </Col>
        </Row>
      </Container>;
  }

  

   

  return <div>
   { logoContent }
   { setup }
   { accountDoesNotExist }
   {/* { mainContent } */}
   { quizContent }
  </div>
}
