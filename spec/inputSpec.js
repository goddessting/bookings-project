let index = require('../src/index');

describe('badminton-pipe', () => {

    describe('booking items', () => {

        it('when input is legal, it should return true', () => {

            let input = 'U123 2016-06-02 20:00~22:00 A';
            let result = index.judgeInput(input);
            let expectResult = true;

            expect(result).toEqual(expectResult);
        });

        it('when input is legal, it should return true', () => {

            let input = 'abcdefghijklmnopqrst1234567890';
            let result = index.judgeInput(input);
            let expectResult = true;

            expect(result).toEqual(expectResult);
        });
    });
});

