// apiGateway.js

const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const bodyParser = require('body-parser');
const cors = require('cors');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Charger les fichiers proto
const movieProtoPath = 'movie.proto';
const tvShowProtoPath = 'tvShow.proto';

const resolvers = require('./resolvers');
const typeDefs = require('./schema');

const app = express();

// Charger les définitions proto
const movieProtoDefinition = protoLoader.loadSync(movieProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const tvShowProtoDefinition = protoLoader.loadSync(tvShowProtoPath, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const movieProto = grpc.loadPackageDefinition(movieProtoDefinition).movie;
const tvShowProto = grpc.loadPackageDefinition(tvShowProtoDefinition).tvShow;

// Créer Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();
  
  app.use(
    cors(),
    bodyParser.json(),
    expressMiddleware(server),
  );

  // Endpoints REST
  app.get('/movies', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051', grpc.credentials.createInsecure());
    client.searchMovies({}, (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.movies);
      }
    });
  });

  app.get('/movies/:id', (req, res) => {
    const client = new movieProto.MovieService('localhost:50051', grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getMovie({ movieId: id }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.movie);
      }
    });
  });

  app.get('/tvshows', (req, res) => {
    const client = new tvShowProto.TVShowService('localhost:50052', grpc.credentials.createInsecure());
    client.searchTvshows({}, (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.tv_shows);
      }
    });
  });

  app.get('/tvshows/:id', (req, res) => {
    const client = new tvShowProto.TVShowService('localhost:50052', grpc.credentials.createInsecure());
    const id = req.params.id;
    client.getTvshow({ tvShowId: id }, (err, response) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(response.tv_show);
      }
    });
  });

  // Démarrer l'application
  const port = 3000;
  app.listen(port, () => {
    console.log(`✅ API Gateway en cours d'exécution sur http://localhost:${port}`);
  });
}

startServer();
