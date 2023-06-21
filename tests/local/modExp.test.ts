import { expect } from 'chai'
import { ModExp } from '../../src/contracts/modExp'

describe('ModExp', () => {
    // Test the modExp function
    describe('modExp', () => {
        it('should correctly calculate modular exponentiation', () => {
            // Initialize ModExp instance with modulus value
            const modExp = new ModExp(1000000007)

            // Test cases
            const testCases = [
                { x: 2, y: 3, expected: 8 },
                { x: 5, y: 0, expected: 1 },
                { x: 10, y: 5, expected: 10 },
                // Add more test cases as needed
            ]

            // Execute the test cases
            testCases.forEach((testCase) => {
                const result = modExp.modExp(testCase.x, testCase.y)
                expect(result).to.equal(testCase.expected)
            })
        })
    })
})
