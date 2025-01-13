Package này dùng để hỗ trợ việc tương tác giữa các ORM với Query-Object từ Client.

## Cài đặt
```js
npm i filter-builder-js
```

## Cách dùng

Đầu tiên, hãy config các thông tin, dùng **FilterBuilderConfig** để làm điều đó. Lưu ý để đoạn code sau ở file entry point của dự án. Ví dụ server.js: 
```js
// server.js
    FilterBuilderConfig.config({
        type: ... ,
        hooks?: ... ,
        factoryAdapter?: ...
        dataSource?: ,
    )
```

Trong đó:
 
|Key|Required|Note|
|---|---|---|
|**type**|Yes|**String** - Orm đang dùng, hiện tại plugin chỉ hỗ trợ 2 orm chính đó là **sequelize** và **typeorm**|
|**factoryAdapter**|No|**FilterBuilderAdapterFactory** - Dùng để đăng ký một Custom FilterAdapter do người dùng tạo ra. Sẽ trình bày ở phần sau|
|**dataSource**|No|**DataSource** - Đôi tượng Datasource (trong typeorm). Lưu ý trường này chỉ sử dụng khi type là **typeorm**.|
|**hooks**|No|**Object** - Danh sách các hooks, dùng để tùy chỉnh kết quả, câu truy vấn,... theo yêu cầu của người dùng. Danh sách hook được trình bày ngay sau đây.|


Danh sách các hooks:
```js

   * beforeEachCondition: Array <( data: BeforeEachConditionDto ) => BeforeEachConditionDto>;
   
   * beforeOrder?: (data: BeforeOrderHookDto) => BeforeOrderHookDto; 
   
   * beforeGroup?: Array <(columnName: string) => string>;
   
   * beforeJoinHook: (joinData: JoinData) => JoinData;
   
   * getColumnName: ( data: GetColumnNameHookDto) => GetColumnNameHookDto; 

```

Ví dụ, để tiến hành chuyển đổi camelCase sang snake_case trước khi tiến hành query dữ liệu từ DB. Ta làm như sau:

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

Trong **FilterBuilder**, mỗi một instance của **FilterBuilder** đều có một config. Do đó, có thể custom config cho từng Filter. Bằng cách sau:

```js
   const filter = new FilterBuilder(...)
   .config(...) // Custom config tại đây
   ...

   await filter.run();
```

## Lọc dữ liệu
Sử dụng FilterBuilder đơn giản như sau:

```js
  const filter = new FilterBuilder(mainTarget, queryData);
```

Trong FilterBuilder, Target là trường tượng đại diện cho một table trong CSDL. Tùy loại ORM mà Target có tên gọi khác nhau. Ví dụ, trong sequelize Target chính là một Model, trong typeorm Target là một Entity.

Đối tượng **queryData** là một Query-Object từ client. Lưu ý, một **queryData** sẽ phân trang nếu chứa 2 trường:

* **page**: Số trang cần load
* **limit**: Số item từng trang, nếu là *undefined* sẽ lấy hết tất cả records trong database.


Các phương thức của FilterBuilder:

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
Mỗi một orm (hoặc query builder) được định nghĩa bằng một Adapter. Do đó, để gắng Filter cho một orm hoặc custom một Filter theo ý người dùng. Ta cần định nghĩa một lớp Adapter mới, lớp này kết thừa từ lớp **FilterBuilderAdapter**:

```js

    export class MyCustomAdapter<
      T extends object,
    > extends FilterBuilderAdapter<T> {

        ....
    }

```

Sau đó cần đăng ký cho FilterBuilder biết lớp Adapter mới của bạn:

```js

    class CustomFactory extends FilterBuilderAdapterFactory {
        static create<T extends object>(opts: FilterBuilderAdapterFactoryOptions<T>): FilterBuilderAdapter<T> {
            return new MyCustomAdapter(....)
        }
    }

    FilterBuilderConfig.config({
        type: "custom",
        factoryAdapter: 
    );
```