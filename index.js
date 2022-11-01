#!/usr/bin/env node

import fetch from "node-fetch";
import chalk from "chalk";
import boxen from "boxen";
import admin from "firebase-admin";
import inquirer from "inquirer";
import {
  readFile
} from "fs/promises";


const FIREBASEAPI = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken";
var WEBAPIKEY;
var SERVICEACCOUNTFILENAME;
var USERUID;

await requestWebAPiKey();
await requestServiceAccountFileName();
await readServiceAccountFile();
await requestFirebaseUserUid();

var customToken = await createCustomToken();
await exchangeCustomTokenWithIdToken(customToken);

async function requestWebAPiKey() {
  await inquirer
    .prompt([{
      name: "webApiKey",
      message: "What is your firebase app Web API Key?",
    }, ])
    .then((answers) => {
      WEBAPIKEY = answers.webApiKey;
      console.info("Web API Key:", answers.webApiKey, '\n');
    });
}

async function requestServiceAccountFileName() {
  await inquirer
    .prompt([{
      name: "serviceAccountFileName",
      message: "What is your firebase app Service Account File Name?",
    }, ])
    .then((answers) => {
      SERVICEACCOUNTFILENAME = answers.serviceAccountFileName;
      console.info("Service Account File Name:", answers.serviceAccountFileName, '\n');
    });
}

async function readServiceAccountFile() {
  try {
    const serviceAccount = JSON.parse(
      await readFile(SERVICEACCOUNTFILENAME)
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.log(
      chalk.white.bgRed.bold(
        "Error! Service account file name is wrong or the file does not exists. \n"
      )
    );
  }
}

async function requestFirebaseUserUid() {
  await inquirer
    .prompt([{
      name: "userUid",
      message: "What is User Uid?",
    }, ])
    .then((answers) => {
      USERUID = answers.userUid;
      console.info("User UID:", answers.userUid, '\n');
    });
}

async function createCustomToken() {
  return admin
    .auth()
    .createCustomToken(USERUID)
    .catch((error) => {
      const msgBox = boxen(chalk.white.bold(error), boxenOptions);
      console.log(msgBox);
    });
}

async function exchangeCustomTokenWithIdToken(customToken) {
  fetch(
      FIREBASEAPI + "?key=" +
      WEBAPIKEY, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customToken,
          returnSecureToken: true,
        }),
      }
    )
    .then((response) => response.json())
    .then((data) => {
      if (data.hasOwnProperty("idToken")) {
        console.log(
          chalk.black.bgWhite.bold("Id Token: ") +
          "\n \n" +
          chalk.black.bgGreen.bold(data["idToken"].trim() + "\n")
        );
      } else {
        console.log(chalk.white.bgRed.bold(data['error']['message']));
      }
    })
    .catch((error) => console.log(error));
}