const Bounty0xToken = artifacts.require('./Bounty0xToken.sol');
const Bounty0xCrowdsale = artifacts.require('./Bounty0xCrowdsale.sol');

const founder1 = '0x60d7df77bcc92a0e92c6d2b7b4d276ad0dd33e90';
const founder2 = '0xd32ea3da0044fc5c9554a43bbbb3899c0124a9b5';
const founder3 = '0xb2427291cb661a2ed72c1e66a9fe2faffbb67b2f';
const bounty0Wallet = '0xc9afbf88b36a5c4a0a8a41918552e24a5c3a1958';

const advisors = [
  '0x35e3fa8f6bdb38af7b657866ef39ebe43d9875c2',
  '0xd7383e030e7d277a000eb22fa3dede2ccacd9983',
  '0xf40c533cd70624b361d02884c46840cfb2e4f40c',
  '0x264dfc4f90a58ed2e5be3fb5378e511c468f198f'
];

module.exports = function (deployer) {
  deployer.deploy(Bounty0xToken);
  deployer.deploy(Bounty0xCrowdsale, founder1, founder2, founder3, bounty0Wallet, advisors);
};
