db = db.getSiblingDB('mydb');

db.createCollection("users");

db.users.insertMany([
  {
    "id": 5,
    "name": "Joe",
    "gender": "Male",
    "age": 59,
  },
  {
    "id": 6,
    "name": "Eve",
    "gender": "Female",
    "age": 38,
  },
  {
    "id": 7,
    "name": "Karen",
    "gender": "Female",
    "age": 21,
  },
  {
    "id": 8,
    "name": "Kirsty",
    "gender": "Unknown",
    "age": 25,
  },
  {
    "id": 9,
    "name": "Chris",
    "gender": "Female",
    "age": 30,
  },
  {
    "id": 10,
    "name": "Lisa",
    "gender": "Female",
    "age": 47,
  },
  {
    "id": 11,
    "name": "Tom",
    "gender": "Male",
    "age": 15,
  },
  {
    "id": 12,
    "name": "Stacy",
    "gender": "Unknown",
    "age": 20,
  },
  {
    "id": 13,
    "name": "Charles",
    "gender": "Male",
    "age": 13,
  },
  {
    "id": 14,
    "name": "Mary",
    "gender": "Female",
    "age": 29,
  },
  {
    "name": "nbc",
    "gender": "female",
    "age": 16,
    "id": 15
  }
]);