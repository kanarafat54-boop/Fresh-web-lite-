# Ara6 Programming Language Specification

## Overview
Ara6 is a revolutionary, simple yet powerful programming language designed for building scalable social media platforms. It combines ease of use with performance optimization.

## Syntax Basics

### Variables & Data Types
```ara6
var name = "John"
var age = 25
var isActive = true
var balance = 1500.50
var skills = ["coding", "design", "marketing"]
var user = {name: "John", age: 25, city: "NYC"}
```

### Functions
```ara6
func greet(name) {
  return "Hello, " + name
}

func add(a, b) {
  return a + b
}
```

### Control Flow
```ara6
if (age > 18) {
  print("Adult")
} else {
  print("Minor")
}

for i in range(1, 10) {
  print(i)
}

while (isActive == true) {
  // code block
}
```

### Objects & Classes
```ara6
class User {
  var username
  var email
  var followers = 0
  
  func __init__(username, email) {
    this.username = username
    this.email = email
  }
  
  func follow() {
    this.followers += 1
  }
}
```

### Async/Await
```ara6
async func fetchUserData(userId) {
  var data = await getUserFromDB(userId)
  return data
}
```

### Error Handling
```ara6
try {
  var result = riskyOperation()
} catch error {
  print("Error: " + error.message)
}
```

### Built-in Functions
- `print(value)` - Output to console
- `len(array/string)` - Get length
- `push(array, value)` - Add to array
- `pop(array)` - Remove last element
- `slice(array, start, end)` - Get array slice
- `join(array, separator)` - Join array elements
- `split(string, separator)` - Split string
- `uppercase(string)` - Convert to uppercase
- `lowercase(string)` - Convert to lowercase
- `contains(string, substring)` - Check if contains
- `replace(string, old, new)` - Replace text
- `parseInt(value)` - Convert to integer
- `parseFloat(value)` - Convert to float
- `isEmpty(value)` - Check if empty
- `isNull(value)` - Check if null
- `type(value)` - Get data type
- `sort(array)` - Sort array
- `reverse(array)` - Reverse array
- `filter(array, condition)` - Filter array
- `map(array, function)` - Map array
- `timestamp()` - Get current timestamp
- `hash(value)` - Generate hash
- `encrypt(text, key)` - Encrypt text
- `decrypt(text, key)` - Decrypt text

## Advanced Features

### Decorators
```ara6
@secure
@rateLimit(100)
func createPost(postData) {
  // Function body
}
```

### Modules/Imports
```ara6
import db from "database"
import auth from "authentication"
import utils from "utilities"
```

### Comments
```ara6
// Single line comment
/* Multi-line
   comment */
```

## Compilation
Ara6 code is transpiled to JavaScript for browser compatibility and Node.js execution.

## Security Features
- Built-in encryption/decryption
- Automatic SQL injection prevention
- XSS attack mitigation
- CSRF token generation
- Rate limiting decorators
- Input validation helpers