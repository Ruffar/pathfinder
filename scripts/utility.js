

function BinarySearch(list, target) {
    //Returns a dictionary: {found: boolean, index: integer} where index refers to that of
    //the last element passed through even if the target isn't found

    var start = 0;
    var end = list.length;
    var mid = 0;

    while (start < end) {
        mid = Math.floor((start+end)/2);
        currentElement = list[mid]
        if (currentElement == target) {
            return {found: true, index: mid};
        } else if (currentElement > target) {
            end = mid;
        } else {
            start = mid+1;
        }
    }
    return {found: false, index: mid};
}


class Queue {
    #elements;

    constructor() {
        this.#elements = [];
    }

    enqueue(newElement) {
        this.#elements.push(newElement);
    }

    dequeue() {
        return this.#elements.shift();
    }

    peek() {
        return this.#elements[0];
    }

    length() {
        return this.#elements.length;
    }

    contains(element) {
        for (var i = 0; i < this.#elements.length; i++) {
            var e = this.#elements[i];
            if (e === element) {
                return true;
            }
        }
        return false;
    }
}



class PriorityQueue {
    #queues;
    #priorities;

    constructor() {
        this.#queues = [];
        this.#priorities = [];
    }

    enqueue(newElement, priority) {
        if (this.#queues.length == 0) {
            this.#queues.push(new Queue());
            this.#queues[0].enqueue(newElement);
            this.#priorities.push(priority);
        } else {
            var queueSearch = BinarySearch(this.#priorities, priority);
            if (queueSearch.found) { //Queue exists, enqueue there
                this.#queues[queueSearch.index].enqueue(newElement);

            } else { //Queue doesnt exist yet
                if (this.#priorities[queueSearch.index] < priority) {
                    //If the closest priority is less than the wanted priority
                    //We insert at an index higher
                    queueSearch.index += 1
                }
                this.#queues.splice(queueSearch.index, 0, new Queue());
                this.#queues[queueSearch.index].enqueue(newElement);
                this.#priorities.splice(queueSearch.index, 0, priority);
            }
        }
    }

    dequeue() {
        if (this.#queues.length == 0) {
            return null;
        } else {
            var toReturn = this.#queues[0].dequeue();
            if (this.#queues[0].length() == 0) {
                //Delete queue if nothing is left in the priority
                this.#queues.shift();
                this.#priorities.shift();
            }
            return toReturn;
        }
    }

    peek() {
        if (this.#queues.length == 0) {
            return null;
        } else {
            return this.#queues[0].peek();
        }
    }

    length() {
        var length = 0;
        for (var i = 0; i < this.#queues.length; i++) {
            var queue = this.#queues[i]
            length += queue.length();
        }
        return length;
    }

    contains(element) {
        for (var i = 0; i < this.#queues.length; i++) {
            var queue = this.#queues[i]
            if (queue.contains(element)) {
                return true;
            }
        }
        return false;
    }
}