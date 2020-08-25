const { ApiPromise, WsProvider } = require('@polkadot/api');
const createPair = require('@polkadot/keyring/pair').default;
const { cryptoWaitReady, encodeAddress, mnemonicToMiniSecret, schnorrkelKeypairFromSeed } = require('@polkadot/util-crypto');
const toSS58 = encodeAddress;

async function main() {

  const provider = new WsProvider('wss://rpc.polkadot.io');

  const api = await ApiPromise.create({
    provider,
  });

  const txPool = [api.tx.balances.transfer('address', 1000000000),
  api.tx.balances.transfer('address', 1000000000)];

  const mnemonic = '*** mnemonic ***'

  cryptoWaitReady().then(() => {
    const transfer = api.tx.utility.batch(
      txPool
    );

    const seed = mnemonicToMiniSecret(mnemonic);
    const keyPair = schnorrkelKeypairFromSeed(seed);

    const alice = createPair({ toSS58, type: 'sr25519' }, { publicKey: keyPair.publicKey, secretKey: keyPair.secretKey }, {});

    transfer.signAndSend(alice, ({ events = [], status }) => {
      if (status.isInBlock) {
        console.log('Successful transfer of with hash ' + status.asInBlock.toHex());
      } else {
        console.log('Status of transfer: ' + status.type);
      }

      events.forEach(({ phase, event: { data, method, section } }) => {
        console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString());
        if (status.type === 'Finalized' && section + '.' + method === 'system.ExtrinsicSuccess') {
          console.log('transfer success');
          api.disconnect();
        }
      });
    });
  });
};

main();