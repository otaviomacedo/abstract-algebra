class Range {
    constructor(first, last) {
        this._first = first;
        this._last = last;
    }

    every(fn) {
        for (let i = this._first; i <= this._last; i++) {
            if (!fn(i)) {
                return false;
            }
        }
        return true;
    }

    find(fn) {
        for (let i = this._first; i <= this._last; i++) {
            if (fn(i)) {
                return i;
            }
        }
    }

    map(fn) {
        let result = [];
        for (let i = this._first; i <= this._last; i++) {
            result.push(fn(i));
        }
        return result;
    }

    toArray() {
        return this.map(x => x);
    }
}

class Permutation {
    constructor(size) {
        this.size = size;
        this._domain = new Range(1, size);
    }

    apply(x) {
    }

    transpose(n1, n2) {
        return new TransposedPermutation(this, n1, n2);
    }

    compose(permutation) {
        return new Composition(this.size, this, permutation);
    }

    inverse() {
        return new MemoizedPermutation(new InversePermutation(this));
    }

    disjointCycles() {
        let backlog = this._domain.toArray();
        let result = [];
        while (backlog.length > 0) {
            let element = backlog[0];
            let cycle = [];
            while (backlog.includes(element)) {
                cycle.push(element);
                backlog.splice(backlog.indexOf(element), 1);
                element = this.apply(element);
            }

            if (cycle.length > 1) {
                result.push(cycle);
            }

        }
        return result;
    }

    isEven() {
        return this.disjointCycles().length % 2 === 0;
    }

    isOdd() {
        return !this.isEven();
    }

    power(n) {
        if (n < 0) {
            throw new Error("Sorry, we don't support negative exponentials yet :(");
        }

        let result = Permutations.Identity(this.size);
        for (let i = 1; i <= n; i++) {
            result = result.compose(this);
        }
        return result;
    }

    equals(other) {
        if (this.size === other.size) {
            return this._domain.every(x => this.apply(x) === other.apply(x));
        }
        return false;
    }

    toString() {
        return this._domain.map(x => `${x}: ${this.apply(x)}`).join('\n');
    }
}

class MemoizedPermutation extends Permutation {
    constructor(permutation) {
        super(permutation.size);
        this._memo = {};
    }

    apply(x) {
        if (!this._memo[x]) {
            this._memo[x] = permutation.apply(x);
        }
        return this._memo[x];
    }
}

// Lazy implementation
class InversePermutation extends Permutation {
    constructor(permutation) {
        super(permutation.size);
        this._permutation = permutation;
    }

    apply(x) {
        if (x > this.size) {
            throw new Error(`Permutation undefined for ${x}`);
        }

        return this._domain.find(i => this._permutation.apply(i) === x);
    }
}

class ArrayPermutation extends Permutation {
    constructor(array) {
        super(array.length);
        if (!ArrayPermutation._isValid(array)) {
            throw new Error(`This is not a permutation`);
        }
        this._array = array;
    }

    static _isValid(array) {
        var seen = new Set;
        array.forEach(item => {
            if (item < 1 || item > array.length || seen.has(item)) {
                return false;
            }
            seen.add(item);
        });
        return seen.size === array.length;
    }

    apply(x) {
        let input = x - 1;
        if (input <= this.size) {
            return this._array[input];
        }
        else {
            throw new Error(`Permutation undefined for ${x}`);
        }
    }
}

class Composition extends Permutation {
    constructor(size, left, right) {
        super(size);

        if (left.size !== right.size) {
            throw new Error(`Permutations don't have the same size`);
        }

        this._left = left;
        this._right = right;
    }

    apply(x) {
        return this._left.apply(this._right.apply(x));
    }
}

class Permutations {
    static toTranspositions(permutation) {
        //FIXME: This function doesn't compute the transpositions of the identity permutation
        let nextMismatch = function(temp, n1, n2){
            if (n1 && temp.apply(n1) !== permutation.apply(n1)) return n1;
            if (n2 && temp.apply(n2) !== permutation.apply(n2)) return n2;
            return permutation._domain.find(x => temp.apply(x) !== permutation.apply(x))
        }

        let result = [];
        let temp = Permutations.Identity(permutation.size);
        let next = nextMismatch(temp);
        while (next) {
            let n1 = temp.apply(next);
            let n2 = permutation.apply(next);
            result.push([n1, n2]);
            temp = temp.transpose(n1, n2);
            next = nextMismatch(temp, n1, n2);
        }

        return result.reverse();
    }

    static Identity(size) {
        //TODO can we cache this instance?
        return new Identity(size);
    }

    static fromCycles(size, cycles) {
        let reducer = (permutation, cycle) => permutation.compose(new Cycle(size, cycle));
        return cycles.reduce(reducer, Permutations.Identity(size));
    }
}

class Identity extends Permutation {
    constructor(size) {
        super(size);
    }

    apply(x) {
        if (x > this.size) {
            throw new Error(`Permutation undefined for ${x}`);
        }
        return x;
    }
}

class TransposedPermutation extends Permutation {
    constructor(permutation, n1, n2) {
        super(permutation.size);
        this._permutation = permutation;
        this._n1 = n1;
        this._n2 = n2;
    }
        
    apply(x) {
        let image = this._permutation.apply(x);
        if (image) {
            if (image === this._n1) return this._n2;
            if (image === this._n2) return this._n1;
            return image;
        }
        else {
            throw new Error(`Permutation undefined for ${x}`);
        }
    }
}

class Cycle extends Permutation {
    constructor(size, cycle) {
        super(size);
        this._cycle = cycle;
    }

    apply(x) {
        if (x > this.size) {
            throw new Error(`Permutation undefined for ${x}`);
        }

        let result = x;
        this._cycle.forEach((element, i) => {
            if (element === x) {
                let next = (i < this._cycle.length - 1) ? i + 1 : 0;
                result = this._cycle[next];
            }
        });

        return result;
    }
}

function print(variable, x) {
    console.log(`$${variable} = ${x.map(cycle => `(${cycle.join()})`).join('')}$\\\\`)
}

function powers(p) {
    print("\\alpha^1", p.power(1).disjointCycles())
    print("\\alpha^2", p.power(2).disjointCycles())
    print("\\alpha^3", p.power(3).disjointCycles())
    print("\\alpha^4", p.power(4).disjointCycles())
    print("\\alpha^5", p.power(5).disjointCycles())
    print("\\alpha^6", p.power(6).disjointCycles())
    print("\\alpha^7", p.power(7).disjointCycles())
    print("\\alpha^8", p.power(8).disjointCycles())
    print("\\alpha^9", p.power(9).disjointCycles())
    print("\\alpha^{10}", p.power(10).disjointCycles())
    console.log("------------------------------------")
}

// powers(new Cycle(6, [1, 2, 3, 4, 5, 6]))

new ArrayPermutation([1, 2, 5, 4, 0])
