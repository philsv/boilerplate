class ModExp {
    // max # of bits for e = ceil(log2(y))
    static readonly N: number = 232
    M: number

    constructor(modulus: number) {
        this.M = modulus
    }

    modExp(x: number, y: number): number {
        let res = 1
        x %= this.M

        if (x !== 0) {
            for (let i = 0; i < ModExp.N; i++) {
                if (y >= 0) {
                    // If y is odd, multiply x with result
                    if (y % 2 === 1) {
                        res = (res * x) % this.M
                    }

                    // y >> 1
                    y = Math.floor(y / 2)
                    x = (x * x) % this.M
                }
            }
        } else {
            res = 0
        }

        return res
    }

    main(x: number, y: number, z: number): void {
        if (z !== this.modExp(x, y)) {
            throw new Error('Invalid result')
        }
    }
}
