from pymongo import MongoModel

class User(MongoModel):
    collection = "users"

    usertype: str
    username: str
    email: str
    role: str
    password: str
    created_at: str
    updated_at: str
    pfp: str
    crfToken: str
    resetToken: str
    resetTokenExpiry: str
    clientToken: str
    consented: bool
    points: int
    number_of_wins: int

    