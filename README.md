### Tokenized Votes Weekend Project


### Week 3 Project Plan:

1. Write smart contract
2. Write test cases: @Juan_Gomez
3. Deploy contract
4. Deploy scripts:
    + giveVotingTokens: @Nguyen
    + delegateVotingPower: @intentions
    + castingVote: @Rita Alfonso / Alfonso Tech
    + checkingVotePower: @Dennis Kim
    + queryingResults @Dennis Kim


## Contracts deployment:
+ **scripts/DK_DeployMyERC20Token.ts** to deploy the token as follows:
```bash
npx ts-node --files ./scripts/DK_DeployMyERC20Token.ts <ACCT1_ADDRESS> <ACCT2_ADDRESS>
```

*ACCT1_ADDRESS and ACCT2_ADDRESS are minted tokens*

```bash
...
Deploying MyERC20Token contract...
Contract deployment transaction hash: 0x6677b88c469b3d3dba7bb9783a49487463c86228c98b3adc78f1fe76267f46eb
Waiting for confirmations...
MyERC20 contract deployed to: 0x77ec5e6688e9e212feedfe08ea67ecd911bae5d9 
...
``` 
+ use **scripts/DK_DeployTokenizedBallot.ts** to deploy the ballot:

```bash
npx ts-node --files ./scripts/DK_DeployTokenizedBallot.ts "Proposal1" "Proposal2" "Proposal3" <TOKEN_ADDRESS>
```
*note the token address as parameter (0x77ec5e6688e9e212feedfe08ea67ecd911bae5d9)*
```bash
...
ERC20 Token Contract Address: 0x77ec5e6688e9e212feedfe08ea67ecd911bae5d9
...
Deploying TokenizedBallot contract...
Transaction hash: 0x7cd4d3e7c3be3f56dc86b26dabedbf278506d360b2a5641f7cec8d558e8114d8
Waiting for confirmations...
Ballot contract deployed to: 0xec6d02d7123c028b5dc4bad28abfdf6c9ab72757
...
Checking Deployer's voting rights...
Deployer has 0 of voting tokens
Deployer has delegated himself voting tokens
Deployer has 90000000000000000000 of voting tokens
```

## Getting Started
Local copy setup:

```bash
git clone https://github.com/Kayaba-Attribution/week3_project_tokenizedVotes
cd week3_project_tokenizedVotes
npm install --save-dev @openzeppelin/contracts
npm i
npm run compile
```

Running Tests:
1. Initialize node
```zsh
npx hardhat node 
```

2. Run tests on node
```zsh
npx hardhat test --network localhost 
```

```zsh
  MyToken
    ERC20 Functionality
      ✔ uses a valid ERC20 as payment token (128ms)
    Minting
      ✔ mint fails if not called by owner
      ✔ mint MINT_VALUE tokens to an account
    Voting Power
      ✔ Voting power is 0 without delegation
      ✔ Voting without voting power should fail
    Delegation
      ✔ Self delegation and check voting power
    Token Transfer and Voting Power
      ✔ Voting power is decreased on transfer & receiver has 0 voting power

  TokenizedBallot
    Deployment
      ✔ has the provided proposals (57ms)
      ✔ has zero votes for all proposals
      ✔ deploys with correct token contract and target block
      ✔ check deployer has MINTER role
    Voting
      ✔ allows voting with sufficient voting power (39ms)
      ✔ prevents voting with insufficient voting power
      ✔ prevents voting more than once with full voting power (43ms)
    Winner calculation
      ✔ correctly calculates the winning proposal (90ms)
      ✔ returns the first proposal in case of a tie (71ms)

  16 passing (571ms)
```
Checks:
+ .env file


Files:

+ **contracts/MyToken.sol**: ERC20Votes token
+ **contracts/TokenizedBallot.sol**: Custom Voting Contract

| Unique id | Discord username           |
| --------- | -------------------------- |
| ZvieX3    | @Dennis Kim                |
| 64tSCL    | @Zarq                      |
| zAY7H0    | @Juan_Gomez                |
| sS1JR2    | @intentions                |
| WPQzqk    | @Nguyen                    |
| CSNhKJ    | @Rita Alfonso / Alfonso Tech |



