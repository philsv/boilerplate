import { expect, use } from 'chai'
import { MethodCallOptions, PubKey, Sha256, findSig, hash256, sha256, toByteString, toHex } from 'scrypt-ts'
import { CoinToss } from '../../src/contracts/cointoss'
import { getDummySigner, getDummyUTXO, randomPrivateKey } from '../utils/helper'
import chaiAsPromised from 'chai-as-promised'
use(chaiAsPromised)

describe('Test SmartContract `Cointoss`', () => {
    let instance: CoinToss
const [aliceprivatekey,alicepublickey] = randomPrivateKey()
const [bobprivatekey,bobpublickey] = randomPrivateKey()
    before(async () => {
        await CoinToss.compile()
        instance = new CoinToss(PubKey(toHex(alicepublickey)),PubKey(toHex(bobpublickey)),
        hash256(toByteString('alice',true)),hash256(toByteString('bob',true)),toByteString('n',true))
        await instance.connect(getDummySigner([aliceprivatekey,bobprivatekey]))
    })

    it('should pass the public method unit test successfully.', async () => {
        const { tx: callTx, atInputIndex } = await instance.methods.toss(
            toByteString('alice',true),toByteString('bob',true),(SigReps) => findSig(SigReps, alicepublickey),
            {
                fromUTXO: getDummyUTXO(),
                pubKeyOrAddrToSign : alicepublickey,
            } as MethodCallOptions<CoinToss>
        )

        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })

})
