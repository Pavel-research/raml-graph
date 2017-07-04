# RAML Graph

### What is the API?
In computer programming, an Application Programming Interface (API) is a set of clearly defined methods of communication
between various software components. 


![API](http://restful-api-design.readthedocs.io/en/latest/_images/scope.png)


A good API makes it easier to develop a computer program by providing all the building blocks, 
which are then put together by the programmer. 

The job of the API code is to access the application state, 
as well as the operations on that state, via the application interface, 
and expose it as a RESTful API. In between the application interface and the RESTful API, 
there is a transformation step that adapts the application data model and makes 
it comply with the RESTful architecture style.

The result of this transformation would be RESTful resources, operations on those resources, and relationships between the resources. 
All of these are described by what we call the RESTful resource model.

### Describing the APIs

Usually we describe APIs using an API specification languages which allows us to document an API in a formal machine readable form.

API specification languages describe APIs in terms of HTTP protocol. In other words we are usually describe APIs
in terms of HTTP methods which are available for access on the set of endpoints, and 
which consume  payloads and return set of responses which should comply to some schemes describing the shape of the data which 
is transferred over network.


### Consuming the API

The client consumes the API via the standard HTTP protocol. However in the most of situations client relies on 
some client side library which provides an access to the API in the terms of the target programming languages and abstracts client
from using HTTP protocol directly. 

Writing and maintaining client libraries is a hard job, so typically instead of manual authoring of client libraries for all 
target programming languages we would prefer to just to generate client library code from formal API description, by using 
client generator software like [Apimatic](https://apimatic.io) or [Swagger Codegen](https://github.com/swagger-api/swagger-codegen)

The most natural mapping of HTTP methods to programming languages is to map them to the functions which consume parameters and
returns some data back to the client. So this is how client generators are usually work.

### The problem

Unfortunately there is a conceptual problem with this representation. As we told earlier - REST APIs is a way to expose application
state and operations on it to the client through resources which represent entities, operations on the resources and relationships 
between them. However when we represent an API as a set of functions this information is lost, so clients which we are generating
will be never as rich and fluent as it may be done if we can make use of this information during construction of client library.

##### Examples:

One typical example of this is collections. We usually expose them as an endpoints which returns an array of entities
and provides some parameters which might be used to iterate through the collection of resources. For example one may 
expose collection of `repositories` with the following RAML snippet.

```raml
/orgs/{orgId}/repos:
   get:
     queryParameters:
       page?: number
       limit?: number
     responses:
      200:
        body:
          properties:
           items: Repository[]
           total: integer
```

So when the client generator will create a function which allows us to iterate through it, The code which actually performs this iteration
may look as ugly as:

```javascript
var page = 0;
  do{
    var organizationRepositories = gitHub.orgs.org(organizationName).repos.get({page:page});
    var repositoriesCount = organizationRepositories.body.length;
    organizationRepositories.body.forEach(function (repo){
      //do something with an repository here...  
    })
    page++;    
  } while(repositoriesCount>0);  
```
`(and it will be even worse if you will use asynchronious calls)`

However if the client generator will be able to understand such abstractions as resource,collection and paging code which
performs this iteration may become as slim as:

```javascript
var org = gitHub.orgs.org(organizationName);
org.repos.forEach(function (repo){
  //do something with an repository here...  
})
```

Is it code generator problem? Unfortunately it is not. Actual problem is that formal API descriptions just does not contain enough of information to understand that repositories endpoint is a collection and to generate code to iterate through it automatically. 

Of course if you as human will look on the repos endpoint definition you will probably able to guess how to write code which
iterates over organisation repositories, but the machines need more formal descriptions to operate on.


### The goals of callable graph project:

We define goals of the callable graph project as follows:
 
 * Provide a set of RAML annotations which allows to enhance API description with
enough of  metadata to allow machines restore information about relationships between resources, operations.
 * Provide a tool which restores representation of the API as a graph of resources and operations on top of them.
 * Provide an example client generator which makes use of this information to generate better clients.




