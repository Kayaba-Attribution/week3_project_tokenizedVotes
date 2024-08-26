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

## Getting Started
Local copy setup:

```bash
git clone https://github.com/Kayaba-Attribution/week3_project_tokenizedVotes
cd week3_project_tokenizedVotes
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



