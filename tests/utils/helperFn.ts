import * as anchor from "@project-serum/anchor";
import { web3, Program } from "@project-serum/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";
import { RideNetwork } from "../../target/types/ride_network";
import { IAllAccounts } from "./types";

export const signAndSendTx = async (
  connection: Connection,
  tx: Transaction,
  payer: Keypair
) => {
  tx.recentBlockhash = (
    await connection.getLatestBlockhash("singleGossip")
  ).blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const rawTransaction = tx.serialize();
  const txSig = await connection.sendRawTransaction(rawTransaction);

  const latestBlockHash = await connection.getLatestBlockhash();

  await connection.confirmTransaction({
    blockhash: latestBlockHash.blockhash,
    lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
    signature: txSig,
  });

  return txSig;
};
export const envSetup = async (
  program: Program<RideNetwork>,
  allAccounts: IAllAccounts
) => {
  const { mainWallet1, mainWallet2, driverInfraOwner, riderInfraOwner, bozo } =
    allAccounts;
  try {
    await program.provider.connection.confirmTransaction(
      await program.provider.connection.requestAirdrop(
        mainWallet1.publicKey,
        1e9
      )
    );
    let ix1 = web3.SystemProgram.transfer({
      fromPubkey: mainWallet1.publicKey,
      toPubkey: driverInfraOwner.publicKey,
      lamports: 0.2 * LAMPORTS_PER_SOL,
    });
    let ix2 = web3.SystemProgram.transfer({
      fromPubkey: mainWallet1.publicKey,
      toPubkey: riderInfraOwner.publicKey,
      lamports: 0.2 * LAMPORTS_PER_SOL,
    });
    let ix3 = web3.SystemProgram.transfer({
      fromPubkey: mainWallet1.publicKey,
      toPubkey: bozo.publicKey,
      lamports: 0.2 * LAMPORTS_PER_SOL,
    });
    let ix4 = web3.SystemProgram.transfer({
      fromPubkey: mainWallet1.publicKey,
      toPubkey: mainWallet2.publicKey,
      lamports: 0.3 * LAMPORTS_PER_SOL,
    });
    let tx = new Transaction().add(ix1, ix2, ix3, ix4);

    signAndSendTx(program.provider.connection, tx, mainWallet1);
    return {
      mainWallet1,
      driverInfraOwner,
      riderInfraOwner,
      bozo,
    };
  } catch (error) {
    console.log("error: ", error);
    process.exit(1);
  }
};

export const extractParts = (input: string): string => {
  const lastHyphenIndex = input.lastIndexOf("-");
  return input.substring(0, lastHyphenIndex);
};
export const formatCoordinate = (
  coordinate: number,
  decimalPlaces = 6
): string => {
  const formattedCoordinate = coordinate.toFixed(decimalPlaces);
  return formattedCoordinate;
};
