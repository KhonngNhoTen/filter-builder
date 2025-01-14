This package supports the interaction between ORMs and Query Objects from the Client.

## Installation
```js
npm i filter-builder-js
```

## Quick start

First, Using **FilterBuilderConfig.config** to define something information. Note, you must run config method in entry point file. In bellow example, server.js is entry point of server: 
```js
// server.js
    FilterBuilderConfig.config({
        type: ... ,
        hooks?: ... ,
        factoryAdapter?: ...
        dataSource?: ,
    )

    const filter = new FilterBuilder (....).in(...).gte(...);
    await filter.run();
```

In There:
 
|Key|Required|Note|
|---|---|---|
|**type**|Yes|**String** - Type of Orm in project, **sequelize** and **typeorm**|
|**factoryAdapter**|No|**FilterBuilderAdapterFactory** - Used to register a custom FilterAdapter created by the user. This will be explained in a later section.|
|**dataSource**|No|**DataSource** -The Datasource object (in TypeORM). Note that this field is only used when the type is **typeorm**.|
|**hooks**|No|**Object** - A list of hooks used to customize results, queries, etc., according to user needs. The list of hooks is presented below.|


List of hooks:
```js

   * beforeEachCondition: Array <( data: BeforeEachConditionDto ) => BeforeEachConditionDto>;
   
   * beforeOrder: (data: BeforeOrderHookDto) => BeforeOrderHookDto; 
   
   * beforeGroup: Array <(columnName: string) => string>;
   
   * beforeJoinHook: (joinData: JoinData) => JoinData;
   
   * getColumnName: ( data: GetColumnNameHookDto) => GetColumnNameHookDto; 

```

Example, To convert *camelCase* to *snake_case* before querying data from the database:

```js
    
    function camelCase2snake_case (str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    
    FilterBuilderConfig.config({
        type: "typeorm",
        hooks: {
            getColumnName: (data: GetColumnNameHookDto) => {
               data.columnName = camelCase2snake_case(data.columnName);
               return data;
            }
        }
    );
```

In **FilterBuilder**, each instance of **FilterBuilder** has its own configuration. Therefore, you can customize the configuration for each filter as follows:

```js
   const filter = new FilterBuilder(...)
   .config(...) // Custom config in here
   ...

   await filter.run();
```

## Filter data
Using FilterBuilder is as simple as the following:

```js
  const filter = new FilterBuilder(mainTarget, queryData);
```

In FilterBuilder, Target is an abstraction that represents a table in your database. Depending on the type of ORM, the Target has different names. For example, in Sequelize, the Target is a Model, while in TypeORM, the Target is an Entity.

**queryData** is a Query-Object from client. Note, a **queryData** will be paginated if it contains two fields:

* **page**: number of page in query
* **limit**: number of item in page, if it *undefined* will get all records in database.


List of method in **FilterBuilder**:

- Binary operator group: 
```js
   .equal() // "=" Operator   
   .gte() // ">=" Operator
   .lte() // "<=" Operator
   .like() // "Like" operator
   .in()  // "IN" operator
   .....
```
- Ternary operation group: 

```js
   .range() // BETWEEN operato
```

- Logical operator group:
```js
   .and(Condition[]) // The AND operator displays a record if all the conditions are TRUE.   
   .or(Condition[]) // The OR operator displays a record if any of the conditions are TRUE.
   .....
```

- Utils methods:
```js
   .uuid() /** Check value is UUID ? and use "=" or "IN" operator */

   .makeArray() /** Parse string to array and use "BETWEEN" operator */
   
   .inConvertedArray() /** Parse string to array and use "IN" operator  */

   .run() /** Return list of Target is filted */

   .leftJoin() /** Left join with other target */

   .rightJoin() /** Right join with other target */

   .transform([async () => {}]) /** Get result and modifíe them */
```

## Custom Filter Adapter
Each ORM (or query builder) is defined by an Adapter. Therefore, to attach a Filter to an ORM or customize a Filter according to the user's needs, we need to define a new Adapter class, which inherits from the **FilterBuilderAdapter** class:

```js

    export class MyCustomAdapter<
      T extends object,
    > extends FilterBuilderAdapter<T> {

        ....
    }

```

Then, you need to register your new Adapter class with **FilterBuilder**:

```js

    class CustomFactory extends FilterBuilderAdapterFactory {
        static create<T extends object>(opts: FilterBuilderAdapterFactoryOptions<T>): FilterBuilderAdapter<T> {
            return new MyCustomAdapter(....)
        }
    }

    FilterBuilderConfig.config({
        type: "custom",
        factoryAdapter: CustomFactory
    );
```





