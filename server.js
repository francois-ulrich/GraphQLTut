const express = require('express');
const { graphqlHTTP } = require("express-graphql");
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull,
    GraphQL,
    graphqlSync,
} = require('graphql');
const app = express();

const authors = [
	{ id: 1, name: 'J. K. Rowling' },
	{ id: 2, name: 'J. R. R. Tolkien' },
	{ id: 3, name: 'Brent Weeks' }
]

const books = [
	{ id: 1, name: 'Harry Potter and the Chamber of Secrets', authorId: 1 },
	{ id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorId: 1 },
	{ id: 3, name: 'Harry Potter and the Goblet of Fire', authorId: 1 },
	{ id: 4, name: 'The Fellowship of the Ring', authorId: 2 },
	{ id: 5, name: 'The Two Towers', authorId: 2 },
	{ id: 6, name: 'The Return of the King', authorId: 2 },
	{ id: 7, name: 'The Way of Shadows', authorId: 3 },
	{ id: 8, name: 'Beyond the Shadows', authorId: 3 }
]

const AuthorType = new GraphQLObjectType({ // Déclaration du type d'objet AuthorType
    name: 'Author',  // Nom du type d'objet, ne peut avoir d'espace
    description: 'This represents an author', // Description du type d'objet
    fields: () => ({ // Champs du type d'objet
        id: { type: GraphQLNonNull(GraphQLInt)},
        name: { type: GraphQLNonNull(GraphQLString)},
        books: { // Récupération de l'objet Author lié à ce livre
            type: GraphQLList(BookType), // On retourne ici une liste de d'objets ayant le type BookType
            resolve: (author) => { 
                return books.filter(book => book.authorId === author.id)
            }
        }
    })
});

const BookType = new GraphQLObjectType({ // Déclaration du type d'objet BookType
    name: 'Book',  // Nom du type d'objet, ne peut avoir d'espace
    description: 'This represents a book writen by an author', // Description du type d'objet

    fields: () => ({ // Champs du type d'objet
        id: { type: GraphQLNonNull(GraphQLInt)},
        name: { type: GraphQLNonNull(GraphQLString)},
        authorId: { type: GraphQLNonNull(GraphQLInt)},
        author: { // Récupération de l'objet Author lié à ce livre
            type: AuthorType,
            resolve: (book) => { // 'book' est ici le parent et représente le livre actuellement checké
                return authors.find(author => author.id === book.authorId)
            }
        }
    })
});

// Déclaration du type d'objet racine, permet de récupérer toutes les données (book / author)
// La RootQueryType permet de récupérer des données via GET
const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Root Query',
    fields: () => ({ // Déclaration des queries possibles à la racine
        authors: {
            type: new GraphQLList(AuthorType),
            description: ' List of all authors',
            resolve: () => authors
        },
        author:{
            type: AuthorType,
            description: 'Find a single author',
            args: {
                id: {type: GraphQLInt}
            },
            resolve: (parent, args) => authors.find(author => author.id === args.id )
        },
        book: { // Permet de trouver un livre en particulier via son ID
            type: BookType,
            description: 'Find a single book',
            // Définition des arguments valides pour cette query
            args: {
                id: { type: GraphQLInt }
            },
            /**
                Avec la query suivante, on trouve Harry Potter and the Chamber of Secrets et son auteur

                {
                    book(id: 1) {
                        name
                        author{
                        name
                        }
                    }
                }
             */
            resolve: (parent, args) => books.find(book => book.id === args.id)
        },
        books: {
            type: new GraphQLList(BookType),
            description: 'List of all books',
            resolve: () => books
        }
    })
});

// Mutations: permet de modifier les données via POST
const RootMutationType = new GraphQLObjectType({
    name: "Mutation",
    description: "Root Mutation",
    fields: () => ({
        // Action permettant d'ajouter un livre
        addBook: {
            type: BookType,
            description: "Add a book",
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
                authorId: { type: GraphQLNonNull(GraphQLInt) }
            },
            resolve: (parent, args) => {
                // Création de l'objet book à ajouter
                const book = {
                    id: books.length + 1,
                    name: args.name,
                    authorId: args.authorId,
                }

                // Push du livre dans l'array books
                books.push(book);

                // Retour du livre
                return book;
            }
        },

        // Action permettant d'ajouter un auteur
        addAuthor: {
            type: AuthorType,
            description: "Add an author",
            args: {
                name: { type: GraphQLNonNull(GraphQLString) },
            },
            resolve: (parent, args) => {
                const author = {
                    name: args.name,
                    id: authors.length + 1,
                }

                // Push de l'auteur dans l'array authors
                authors.push(author);

                return author;
            }
        }
        /**
         * La mutation suivante ajoutera un nouvel auteur:
         * mutation {
                addAuthor(name: "Bram Stoker"){
                    name
                }
            }
         */
    })
})


const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

/**
 * Avec la requête suivante, on récupère tous les livres:
    {
    books {
            id,
            name,
            authorId
        }
    }
 */


//
app.use('/graphql', graphqlHTTP({
    graphiql: true,
    schema: schema,
}));

// Lancement serveur
app.listen(5000., () => console.log('Server Running'));