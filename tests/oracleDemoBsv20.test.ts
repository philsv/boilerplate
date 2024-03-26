import { expect, use } from 'chai'
import {
    Addr,
    ByteString,
    MethodCallOptions,
    PubKey,
    SmartContract,
    bsv,
    findSig,
    toByteString,
} from 'scrypt-ts'
import { OracleDemoBsv20 } from '../src/contracts/oracleDemoBsv20'
import { getDefaultSigner } from './utils/helper'
import { RabinPubKey, RabinSig, WitnessOnChainVerifier } from 'scrypt-ts-lib'
import chaiAsPromised from 'chai-as-promised'
import { BSV20V2P2PKH } from 'scrypt-ord'
use(chaiAsPromised)

// All data was pre-fetched from https://api.witnessonchain.com/
// https://api.witnessonchain.com/#/info/AppController_getInfo
const PUBKEY = {
    publicKey:
        'ad7e1e8d6d2960129c9fe6b636ef4041037f599c807ecd5adf491ce45835344b18fd4e7c92fd63bb822b221344fe21c0522ab81e9f8e848206875370cae4d908ac2656192ad6910ebb685036573b442ec1cff490c1638b7f5a181ae6d6bc9a04a305720559c893611f836321c2beb69dbf3694b9305a988c77e0a451c38674e84ce95a912833d2cf4ca9d48cc76d8250d0130740145ca19e20b1513bb93ca7665c1f110493d1b5aa344702109df5feca790f988eaa02f92e019721ae0e8bfaa9fdcd3401ffb4433fbe6e575ed9f704a6dc60872f0d23b2f43bfe5e64ce0fbc71283e6dedee79e20ad878917fa4a8257f879527c58f89a8670be591fc2815f7e7a8d74a9830788404f66170058dd7a08f47c4954324088dbed2f330015ccc36d29efd392a3cd5bf9835871f6b4b203c228af16f5b461676ce8e51003afd3137978117cf41147f2bb615a7c338bebdca5f81a43fe9b51480ae52ce04cf2f2b1714599fe09ae8401e0e155b4caa89fb37b00c604517fc36961f84901a73a343bb40',
}
// https://api.witnessonchain.com/#/v1/V1Controller_getInscription
const RESP = {
    timestamp: 1711167431,
    outpoint:
        '7972d872ae5cbd4fe1dd5912a7cef79745950bce38ba6f1df912ee1fe5952557_0',
    bsv20: true,
    amt: 10000,
    id: '7972d872ae5cbd4fe1dd5912a7cef79745950bce38ba6f1df912ee1fe5952557_0',
    data: '04c757fe65007972d872ae5cbd4fe1dd5912a7cef79745950bce38ba6f1df912ee1fe595255700000000011027000000000000373937326438373261653563626434666531646435393132613763656637393734353935306263653338626136663164663931326565316665353935323535375f30',
    signature: {
        s: '3b8f6fc2981eac44d8284b149e14acfd98a2b2c104e32c184cb01e1c6206160a2e767488db1754d84842ab664d3027147d2123875a380dd901b736b77db6a279a6f513f2b3ad2daecd44ea54ff920cb99c52da395315c018ba92b0e5e767bbdd5d64249cf535dcada6c8a01b45233f406892604945a29af3e2be8b62ed1f7d7b4415ce7f1081da64aee51eec3464b7a558ac689a834a2d9f31ecac29647221c2d9a757845e5cb621cf2c5c6e8005c4ecb18c98cb4ba30d5850c403e22e42edb064cbf43d7f20d21febc2c36480e2e7ae1a7ef14567f0e4f794600a8004d25729b96cee269409d86ed725c8380db54cc936b46c4512839287bdc3be9226f8b5378e15443761d0d4c33ba94fac1b6175ab57d82861adb88041d8a6635dcca82c1691cd600498681a8f0eaf1c8ceaf4a000edf35a5c6baed5534c43a614138cec9ddcbb2948760cd6f63c7c749bd63788e5eb530ef4461da6f6e9ca46eae374daa7f36dab316e57910e5256c09ff674bd8ad20ab06a98a014f891e7cc17da764806',
        padding: '00',
    },
}

describe('Test SmartContract `OracleDemoBsv20`', () => {
    // token utxo
    const txid =
        '7972d872ae5cbd4fe1dd5912a7cef79745950bce38ba6f1df912ee1fe5952557'
    const vout = 0
    const script =
        '0063036f726451126170706c69636174696f6e2f6273762d3230004c747b2270223a226273762d3230222c226f70223a227472616e73666572222c226964223a22643563663365373239653766363866313630646261643763623363656330303831323765353438343438346436386261326463656264336262663966613737365f30222c22616d74223a22313030227d6876a914700cc86d386b5c4707c06c96985f57ca875266e988ac'
    // keys to unlock token utxo
    const tokenPrivKey = bsv.PrivateKey.fromWIF(
        'cRmsBM2joHToN2fEWWh5eXuSGCinmyG7rSv1d9ZECKcngBXJnWQw'
    )
    const tokenPubKey = tokenPrivKey.publicKey

    let demoInstance: OracleDemoBsv20
    let tokenInstance: BSV20V2P2PKH
    const signer = getDefaultSigner(tokenPrivKey)

    before(async () => {
        // setup demo instance
        OracleDemoBsv20.loadArtifact()
        const rabinPubKey: RabinPubKey =
            WitnessOnChainVerifier.parsePubKey(PUBKEY)
        const inscriptionId = toByteString(`${txid}_${vout}`, true)
        const amt = 10n
        demoInstance = new OracleDemoBsv20(rabinPubKey, inscriptionId, amt)
        await demoInstance.connect(signer)
        await demoInstance.deploy()
        // setup token instance
        tokenInstance = BSV20V2P2PKH.fromUTXO({
            txId: txid,
            outputIndex: vout,
            script,
            satoshis: 1,
        })
        await tokenInstance.connect(signer)
    })

    it('should pass the public method unit test successfully.', async () => {
        // customise call tx for demoInstance
        demoInstance.bindTxBuilder('unlock', (current: OracleDemoBsv20) => {
            const unsignedTx = new bsv.Transaction().addInput(
                current.buildContractInput()
            )
            return Promise.resolve({
                tx: unsignedTx,
                atInputIndex: 0,
                nexts: [],
            })
        })
        // parse the response from the oracle
        const oracleMsg: ByteString = WitnessOnChainVerifier.parseMsg(RESP)
        const oracleSig: RabinSig = WitnessOnChainVerifier.parseSig(RESP)
        // call demoInstance.unlock to get a partial tx
        const partialTx = await demoInstance.methods.unlock(
            oracleMsg,
            oracleSig,
            1n,
            {
                multiContractCall: true,
            } as MethodCallOptions<OracleDemoBsv20>
        )
        // customise call tx for tokenInstance
        tokenInstance.bindTxBuilder(
            'unlock',
            async (
                current: BSV20V2P2PKH,
                options: MethodCallOptions<BSV20V2P2PKH>
            ) => {
                const tokenChange = new BSV20V2P2PKH(
                    toByteString(current.id, true),
                    current.sym,
                    current.max,
                    current.dec,
                    Addr(options.changeAddress!.toByteString())
                ).setAmt(current.getAmt())
                const unsignedTx = options
                    .partialContractTx!.tx.addInput(
                        current.buildContractInput()
                    )
                    .addOutput(
                        new bsv.Transaction.Output({
                            script: tokenChange.lockingScript,
                            satoshis: 1,
                        })
                    )
                    .change(await current.signer.getDefaultAddress())
                return Promise.resolve({
                    tx: unsignedTx,
                    atInputIndex: 1,
                    nexts: [],
                })
            }
        )
        // call tokenInstance.unlock to get the final tx
        const finalTx = await tokenInstance.methods.unlock(
            (sigResps) => findSig(sigResps, tokenPubKey),
            PubKey(tokenPubKey.toHex()),
            {
                multiContractCall: true,
                partialContractTx: partialTx,
                pubKeyOrAddrToSign: tokenPubKey,
                changeAddress: tokenPubKey.toAddress(),
            } as MethodCallOptions<BSV20V2P2PKH>
        )
        // final call
        const callContract = async () =>
            SmartContract.multiContractCall(finalTx, signer)
        return expect(callContract()).not.rejected
    })
})
