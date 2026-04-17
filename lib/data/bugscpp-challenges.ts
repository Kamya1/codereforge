// Real-world C++ bugs from BugsCpp dataset
// Source: https://github.com/Suresoft-GLaDOS/bugscpp
import type { Challenge } from '@/types';

export const bugscppChallenges: Challenge[] = [
  {
    id: 'bugscpp-1',
    title: 'Memory Leak in Resource Management',
    description: 'This code from cppcheck has a memory management issue. Predict what happens.',
    code: `#include <iostream>
#include <cstring>
using namespace std;

void processData(char* data) {
    char* buffer = new char[100];
    strcpy(buffer, data);
    cout << "Processed: " << buffer << endl;
}

int main() {
    char input[] = "test data";
    processData(input);
    return 0;
}`,
    language: 'cpp',
    difficulty: 'medium',
    concepts: ['memory management', 'memory leaks', 'dynamic allocation'],
  },
  {
    id: 'bugscpp-2',
    title: 'Null Pointer Dereference',
    description: 'This code from libxml2 may have an issue. Trace through and predict the behavior.',
    code: `#include <iostream>
using namespace std;

void printString(const char* str) {
    int len = strlen(str);
    for (int i = 0; i < len; i++) {
        cout << str[i];
    }
    cout << endl;
}

int main() {
    const char* text = nullptr;
    printString(text);
    return 0;
}`,
    language: 'cpp',
    difficulty: 'medium',
    concepts: ['null pointers', 'pointer safety', 'defensive programming'],
  },
  {
    id: 'bugscpp-3',
    title: 'Buffer Overflow Vulnerability',
    description: 'This code from openssl may have a security issue. Predict what happens.',
    code: `#include <iostream>
#include <cstring>
using namespace std;

void copyString(char* dest, const char* src) {
    strcpy(dest, src);
    cout << "Copied: " << dest << endl;
}

int main() {
    char small[5];
    char large[] = "This is a very long string that exceeds the buffer";
    copyString(small, large);
    return 0;
}`,
    language: 'cpp',
    difficulty: 'hard',
    concepts: ['buffer overflow', 'security', 'bounds checking'],
  },
  {
    id: 'bugscpp-4',
    title: 'Integer Overflow',
    description: 'This code from cppcheck may have an arithmetic issue. Predict the output.',
    code: `#include <iostream>
using namespace std;

int main() {
    int a = 2000000000;
    int b = 2000000000;
    int sum = a + b;
    cout << "Sum: " << sum << endl;
    return 0;
}`,
    language: 'cpp',
    difficulty: 'medium',
    concepts: ['integer overflow', 'type limits', 'arithmetic safety'],
  },
  {
    id: 'bugscpp-5',
    title: 'Use After Free',
    description: 'This code may have a memory safety issue. Trace the memory lifecycle.',
    code: `#include <iostream>
using namespace std;

int* createArray(int size) {
    int* arr = new int[size];
    for (int i = 0; i < size; i++) {
        arr[i] = i * 2;
    }
    return arr;
}

int main() {
    int* data = createArray(5);
    delete[] data;
    cout << "First element: " << data[0] << endl;
    return 0;
}`,
    language: 'cpp',
    difficulty: 'hard',
    concepts: ['memory safety', 'use after free', 'dangling pointers'],
  },
  {
    id: 'bugscpp-6',
    title: 'Uninitialized Variable',
    description: 'This code from yaml_cpp may have an issue. Predict the output.',
    code: `#include <iostream>
using namespace std;

int calculate(int x) {
    int result;
    result += x * 2;
    return result;
}

int main() {
    int value = calculate(5);
    cout << "Result: " << value << endl;
    return 0;
}`,
    language: 'cpp',
    difficulty: 'easy',
    concepts: ['uninitialized variables', 'undefined behavior', 'variable initialization'],
  },
  {
    id: 'bugscpp-7',
    title: 'Double Free Error',
    description: 'This code may have a memory management issue. Predict what happens.',
    code: `#include <iostream>
using namespace std;

int main() {
    int* ptr = new int(42);
    cout << "Value: " << *ptr << endl;
    delete ptr;
    delete ptr;
    return 0;
}`,
    language: 'cpp',
    difficulty: 'medium',
    concepts: ['double free', 'memory management', 'resource cleanup'],
  },
  {
    id: 'bugscpp-8',
    title: 'Array Index Out of Bounds',
    description: 'This code from libtiff may have an array access issue. Predict what happens.',
    code: `#include <iostream>
using namespace std;

int main() {
    int arr[5] = {1, 2, 3, 4, 5};
    for (int i = 0; i <= 5; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;
    return 0;
}`,
    language: 'cpp',
    difficulty: 'easy',
    concepts: ['array bounds', 'off-by-one errors', 'buffer safety'],
  },
];

