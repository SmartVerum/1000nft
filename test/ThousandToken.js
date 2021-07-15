const ThousandToken = artifacts.require("ThousandToken");

const CUSTOMER_LIMIT = 5;
const SALE_LIMIT_0 = 50;
const SALE_LIMIT_1 = 150;
const SALE_LIMIT_2 = 650;
const SALE_LIMIT_3 = 950;
const TOKENS_LIMIT = 1000;

async function buyToken(instance, account, value) {
    await instance.sendTransaction({
        data: instance.contract.methods.buyToken().encodeABI(),
        from: account,
        value: web3.utils.toWei(value)
    });
}

function tokenCost(index) {
    let cost = "0.1";

    if (index >= SALE_LIMIT_3) {
        cost = "2.5";
    } else if (index >= SALE_LIMIT_2) {
        cost = "1";
    } else if (index >= SALE_LIMIT_1) {
        cost = "0.5";
    } else if (index >= SALE_LIMIT_0) {
        cost = "0.25";
    }

    return cost;
}

contract("ThousandToken", function(accounts) {
    it("check token name", async() => {
        const name = "TokenName";
        const instance = await ThousandToken.new(name, "", "");

        assert.equal((await instance.name.call()).toString(), name, `Name is different than ${name}`);
    });
    it("check token symbol", async() => {
        const symbol = "TKN";
        const instance = await ThousandToken.new("", symbol, "");

        assert.equal((await instance.symbol.call()).toString(), symbol, `Symbol is different than ${symbol}`);
    });
    it("check token URI", async() => {
        const prefix = "https://example.com/";
        const expectedUri = `${prefix}0.json`;
        const instance = await ThousandToken.new("", "", prefix);

        await buyToken(instance, accounts[0], "0.1");

        assert.equal((await instance.tokenURI.call(0)).toString(), expectedUri, `Token URI is different than ${expectedUri}`);
    });
    it("check amount of minted tokens", async() => {
        const instance = await ThousandToken.new("", "", "");

        await buyToken(instance, accounts[0], "0.1");
        await buyToken(instance, accounts[0], "0.1");

        assert.equal((await instance.mintedAmount.call()).toString(), 2, `Amount of minted tokens is different than 2`);
    });
    it("check token URI change", async() => {
        const prefix1 = "https://example.com/";
        const prefix2 = "https://example.net/";
        const expectedUri1 = `${prefix1}0.json`;
        const expectedUri2 = `${prefix2}0`;
        const instance = await ThousandToken.new("", "", prefix1);

        await buyToken(instance, accounts[0], "0.1");

        assert.equal((await instance.tokenURI.call(0)).toString(), expectedUri1, `Token URI is different than ${expectedUri1}`);

        instance.setTokenURIFormat(prefix2, "");

        assert.equal((await instance.tokenURI.call(0)).toString(), expectedUri2, `Token URI is different than ${expectedUri2}`);
    });
    it("check ETH payout by owner", async() => {
        const instance = await ThousandToken.new("", "", "");

        await buyToken(instance, accounts[0], "0.1");
        await buyToken(instance, accounts[0], "1.134");

        const balance = parseInt(await web3.eth.getBalance(accounts[0]));
        const receipt = (await instance.payout()).receipt;
        const transaction = await web3.eth.getTransaction(receipt.transactionHash);
        const gasPrice = parseInt(transaction.gasPrice);
        const gasUsed = parseInt(receipt.gasUsed);

        assert.equal((balance + parseInt(web3.utils.toWei("1.234")) - (gasUsed * gasPrice)), parseInt(await web3.eth.getBalance(accounts[0])), "Account balance was not restored");
    });
    it("check if token can be bought with minimal amount", async() => {
        const instance = await ThousandToken.new("", "", "");

        await buyToken(instance, accounts[0], "0.1");
    });
    it("check if token cannot be bought with insufficient amount", async() => {
        const instance = await ThousandToken.new("", "", "");

        try {
            await buyToken(instance, accounts[0], "0.0001");
        } catch (error) {
            return;
        }

        assert.fail("Account was able to buy token");
    });
    it("check if token can be bought after exceeding per customer limit", async() => {
        const instance = await ThousandToken.new("", "", "");

        try {
            for (let i = 0; i <= CUSTOMER_LIMIT; ++i) {
                await buyToken(instance, accounts[0], "0.1");
            }
        } catch (error) {
            return;
        }

        assert.fail(`Account was able to exceed per customer limit (${CUSTOMER_LIMIT})`);
    });
    it("check if token can be bought after exceeding total limit", async() => {
        const instance = await ThousandToken.new("", "", "");

        try {
            for (let i = 0; i <= TOKENS_LIMIT; ++i) {
                await buyToken(instance, accounts[0], tokenCost(i));
                await instance.transferFrom(accounts[0], accounts[1], i);
                await instance.payout();
            }
        } catch (error) {
            return;
        }

        assert.fail(`Account was able to exceed total limit (${TOKENS_LIMIT})`);
    });
});
