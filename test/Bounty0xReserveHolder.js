import { ONE_DAY_SECONDS, ONE_HOUR_SECONDS, ZERO_ADDRESS } from './helpers/util';
import expectThrow from './helpers/expectThrow';

const Bounty0xToken = artifacts.require('Bounty0xToken');
const Bounty0xReserveHolder = artifacts.require('Bounty0xReserveHolder');
const MockBounty0xReserveHolder = artifacts.require('MockBounty0xReserveHolder');
const KnowsConstants = artifacts.require('KnowsConstants');

contract('Bounty0xReserveHolder', ([ deployer, benefactor ]) => {
  let token;
  let bounty0xReserveHolder;

  before('get the deployed bounty0x token', async () => {
    token = await Bounty0xToken.deployed();
    bounty0xReserveHolder = await Bounty0xReserveHolder.deployed();
  });

  it('should be deployed', async () => {
    assert.strictEqual(typeof bounty0xReserveHolder.address, 'string');
  });

  it('should have a balance of 225.15M', async () => {
    const balance = await token.balanceOf(bounty0xReserveHolder.address);
    assert.strictEqual(balance.valueOf(), '2.2515e+26');
  });

  describe('#release', () => {
    let token;
    let mockReserveHolder;
    let saleStartDate;
    let saleEndDate;
    let unfreezeDate;

    before('set up constants', async () => {
      const constants = await KnowsConstants.new();

      saleStartDate = await constants.SALE_START_DATE();
      saleEndDate = await constants.SALE_END_DATE();
      unfreezeDate = await constants.UNFREEZE_DATE();
    });

    beforeEach('set up the token and mock', async () => {
      token = await Bounty0xToken.new(ZERO_ADDRESS, { from: deployer });
      mockReserveHolder = await MockBounty0xReserveHolder.new(token.address, benefactor, { from: deployer });

      // give it 1 million tokens
      await token.generateTokens(mockReserveHolder.address, Math.pow(10, 24), { from: deployer });
    });

    async function assertNotWithdrawn() {
      const reserveBalance = await token.balanceOf(mockReserveHolder.address);
      assert.strictEqual(reserveBalance.valueOf(), '' + Math.pow(10, 24));

      const benefactorBalance = await token.balanceOf(benefactor);
      assert.strictEqual(benefactorBalance.valueOf(), '0');
    }

    async function assertWithdrawn() {
      const reserveBalance = await token.balanceOf(mockReserveHolder.address);
      assert.strictEqual(reserveBalance.valueOf(), '0');

      const benefactorBalance = await token.balanceOf(benefactor);
      assert.strictEqual(benefactorBalance.valueOf(), '' + Math.pow(10, 24));
    }

    it('should not release at or around start and end dates', async () => {
      // this creates a bunch of permutations of times around the start and end date
      const timeArrays = [ saleStartDate, saleEndDate ]
        .map(
          time => [ ONE_DAY_SECONDS * -1, ONE_HOUR_SECONDS * -1, 0, ONE_HOUR_SECONDS, ONE_DAY_SECONDS ]
            .map(offset => time.plus(offset))
        );

      // make sure they all fail to release
      for (let time of Array.prototype.concat.apply([], timeArrays)) {
        await mockReserveHolder.setTime(time);
        expectThrow(mockReserveHolder.release());

        await assertNotWithdrawn();
      }
    });

    it('cannot be withdrawn just before the unfreeze date', async () => {
      await mockReserveHolder.setTime(unfreezeDate.sub(ONE_DAY_SECONDS));
      expectThrow(mockReserveHolder.release());
      await assertNotWithdrawn();

      await mockReserveHolder.setTime(unfreezeDate.sub(ONE_HOUR_SECONDS));
      expectThrow(mockReserveHolder.release());
      await assertNotWithdrawn();

      await mockReserveHolder.setTime(unfreezeDate.sub(1));
      expectThrow(mockReserveHolder.release());
      await assertNotWithdrawn();
    });

    it('can be withdrawn on the release date', async () => {
      await mockReserveHolder.setTime(unfreezeDate);
      const withdrawTx = await mockReserveHolder.release();
      await assertWithdrawn();

      expectThrow(mockReserveHolder.release());
    });

    it('can be withdrawn after the release date', async () => {
      await mockReserveHolder.setTime(unfreezeDate.plus(ONE_DAY_SECONDS));
      const withdrawTx = await mockReserveHolder.release();
      await assertWithdrawn();

      expectThrow(mockReserveHolder.release());
    });
  });
});
