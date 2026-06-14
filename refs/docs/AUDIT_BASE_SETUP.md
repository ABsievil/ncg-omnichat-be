# Audit Setup Nền Tảng – Omnichat Backend

> Tài liệu đi kèm `refs/docs/AI_CLEAN_CODE_RULES.md`.
> Phạm vi: rà soát toàn bộ `src/` (app, common, configs, router, modules, worker, main) ở phiên bản hiện tại trước khi mở rộng các module nghiệp vụ.
> Mục tiêu: liệt kê các điểm cần cải tiến để **tránh refactor tốn kém** khi codebase scale lên hàng chục module.

---

## 0. Tóm tắt điều hành

| Hạng mục | Đánh giá nhanh | Ưu tiên |
|----------|----------------|---------|
| Base repository (`database.repository.ts`, `database.objectId.repository.ts`, `database.helper.repository.ts`) | `@ts-nocheck`, ~6.500 dòng tổng cộng, copy-paste, lookup engine nhồi vào base, hai phiên bản V1/V4 song song | **Cao** |
| Skeleton thư mục (`src/modules/`, `src/worker/`, `src/common/queues/`) | Rỗng, không có quy ước rõ về vị trí domain modules / background processing | **Cao** |
| Layering | `common/*` import ngược lại `app/*` (enum, interface, constants) → vi phạm clean architecture | **Cao** |
| Encryption (`ChecksumInterceptor`, `RequestDecryptInterceptor`) | Đăng ký global, không opt-in, IV không lấy từ body, fallback có thể set `body = undefined` | **Cao** |
| Header / metadata (success vs error) | 5 cặp header khác nhau, kiểu timestamp khác nhau, `release` vs `repoVersion` không thống nhất | **Cao** |
| Header ngôn ngữ | Middleware nhận `x-lang`, I18n & interceptor đọc `x-custom-lang`, CORS chỉ allow `x-lang` → mismatch 3 nơi | **Cao** |
| `IRequestApp` vs `IRequestWithContext` | Hai interface song song, type request bị fragment | **Cao** |
| Helper module | Gom JWT, AES, Firebase, HTTP, phone, currency, date branch logic → vi phạm SRP, JWT default secret hardcode, AES key không validate | **Cao** |
| HelperDateService `startOf/endOf` | Bug Luxon immutable – option `dayOf` không có tác dụng | **Cao** |
| `FileImportException` | Tồn tại 2 class trùng tên ở 2 nơi → filter không bắt được, rơi 500 | **Cao** |
| `FileExcelValidationPipe` | `validate(array)` sai cách dùng class-validator | **Cao** |
| Date validators copy-paste sai tên decorator | `LessThan` đăng ký với name `GreaterThan` | **Cao** |
| Pagination DTO | Trộn `page/perPage` (offset) + `lastTime` (cursor), prefix `_` không idiomatic | Trung |
| Pubsub `publishBatch` | Không batch thực, gọi `publishMessage` 1-by-1; auto create topic ở production | Trung |
| Config validation | Không có schema (joi/zod) cho biến môi trường | Trung |
| Test / CI | `test/` chưa có gì, không có e2e, README còn template Nest gốc | Trung |
| `tsconfig.json` | `noImplicitAny: false`, `strictBindCallApply: false`, `strict: false` (ngầm) → mất nhiều an toàn type | Trung |
| `IDatabaseService` interface | Thiếu khai báo cho `filterDateOverlap`, `filterCompareTwoNumber` đã hiện thực | Thấp |

> Các mục **Cao** nên chốt phương án trước khi seed module nghiệp vụ tiếp theo.

---

## 1. Kiến trúc tổng thể & layering

### 1.1. `common/*` đang import ngược lên `app/*`
- `src/common/database/services/database.options.service.ts:5` → `src/app/enums/app.enum.ts`
- `src/common/helper/services/helper.date.service.ts` → `src/app/constants/app.constant.ts` (DEFAULT_UTC)
- `src/common/encryption/...` → `src/app/enums`
- `src/common/response/services/error-response.service.ts` → `src/app/interfaces/app.interface.ts`
- `src/common/request/exceptions/request.validation.exception.ts` → status code enum (app)

**Hệ quả**: tạo dependency cycle ngầm; khi tách `common` thành package tái dùng (vd. `@omnichat/core`) sẽ kẹt.

**Đề xuất**:
- Thêm tầng `src/core/` (hoặc `src/shared/`) để chứa enum/interface/constant **dùng chung không phụ thuộc framework**.
- `src/app/*` chỉ compose cấu hình, không export type cho `common/*` reverse-import.
- Giữ nguyên tắc: `app → common → core/shared`.

### 1.2. Skeleton chưa hoàn chỉnh
| Thư mục | Trạng thái | Ghi chú |
|---------|-----------|---------|
| `src/modules/` | rỗng | Chưa có domain module nào (auth, user, conversation, ...). Cần định nghĩa template module tham chiếu trước khi sinh hàng loạt. |
| `src/worker/` | rỗng | Không rõ là background processor (Bull/PubSub consumer) hay micro-service. Thiếu module/main entry. |
| `src/common/queues/` | rỗng (chỉ có thư mục) | Có dấu hiệu định hướng dùng queue nhưng thiếu abstraction. |

**Đề xuất**:
- Quyết sớm: dùng **BullMQ + Redis** hay **Pub/Sub Subscriber** làm worker chính. Thiết kế `IJob`, `IJobHandler`, `JobQueueService` chung trước khi viết job đầu tiên.
- Tạo template module mẫu (`src/modules/_template/`) gồm: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts`, `dtos/`, `entities/`, `interfaces/`, `enums/`, `constants/`.
- Cập nhật `nest-cli.json` schematics root để generator nhả đúng cấu trúc.

### 1.3. `RouterModule` register – role-based chưa có guard tương ứng
`src/router/router.module.ts:9-13` map prefix `public`, ``, `admin`. Hiện chưa có `RolesGuard`, `JwtGuard`. Khi thêm module phải nhớ áp guard riêng cho từng nhóm.

**Đề xuất**:
- Thêm `AppAuthGuard` apply mặc định ở `RoutesUserModule`/`RoutesAdminModule` qua `APP_GUARD` scoped per route module hoặc dùng `@Public()` decorator chung.
- Định nghĩa contract role rõ ràng (enum `ENUM_APP_ROLE`).

---

## 2. Database / Base Repository (CRITICAL)

### 2.1. `// @ts-nocheck` ở 3 file repository lớn
- `src/common/database/repositories/database.repository.ts:1`
- `src/common/database/repositories/database.objectId.repository.ts:1`
- `src/common/database/repositories/database.helper.repository.ts:1`

→ Tắt hoàn toàn type-check ~6.500 dòng. Mọi sai lệch type silent leak ra service/use-case.

**Tác hại đã thấy ngay**:
- `data[DATABASE_AUDIT_FIELD.CREATED_BY] = ...` mutate input mà không cảnh báo (`database.repository.ts:378`).
- `getCurrentUserId()` ở `database.repository.ts:78` trả `user._id`, ở `database.objectId.repository.ts:76` trả `user.id` → **không nhất quán**.
- `softDeleteMany` (`database.repository.ts:608`, `database.objectId.repository.ts:592`) hardcode `deleted: false`, **bỏ qua** `withDeleted` option.
- `restoreMany` đảo nghĩa `withDeleted` ngầm (luôn tìm `deleted: true`).

**Đề xuất**:
1. Bỏ `@ts-nocheck`. Viết generic chuẩn `DatabaseRepositoryBase<TEntity, TFilter, TUpdate>` dựa trên `Model<HydratedDocument<TEntity>>` của Mongoose 8.
2. Tách thành các trait/mixin nhỏ:
   - `ReadRepository` (find, findOne, exists, getTotal, distinct, aggregate)
   - `WriteRepository` (create, update, upsert, save, delete)
   - `BulkRepository` (createMany, updateMany, deleteMany, bulkWrite)
   - `SoftDeleteRepository` (softDelete, softDeleteMany, restore, restoreMany)
   - `AuditRepository` (apply createdBy/updatedBy/deletedBy/approvedBy)
3. **Lookup engine không thuộc base repository.** Tách thành `LookupQueryBuilder` (service riêng) injectable; repository chỉ delegate.

### 2.2. Trùng lặp giữa 3 base repository
- `database.repository.ts` (UUID) và `database.objectId.repository.ts` (ObjectId) gần như **copy 100%**, chỉ khác kiểu `_id` và `getCurrentUserId()`.
- `database.helper.repository.ts` còn copy thêm một bản nữa nhưng thiếu một số method (`buildDeletedFilter`, `bulkWrite`, `distinct`, `createManyDocs`, `withTransaction`).

**Đề xuất**:
- Một class generic duy nhất `DatabaseRepositoryBase<TEntity extends BaseEntity<TId>, TId>` với type guard `TId = string | Types.ObjectId`.
- Loại bỏ hẳn `database.helper.repository.ts` (đó là hậu quả của fork sớm). Giữ một bản single-source.
- Re-export qua `bases/` (như đang làm) để service nghiệp vụ vẫn import được.

### 2.3. Hai phiên bản lookup V1 và V4 song song
`findAllWithLookup` (V1) và `findAllWithLookupV4` (V4) đồng tồn tại trong cùng class. V4 dùng pure aggregation pipeline; V1 lai application-side sort và populate ngoài.

**Vấn đề**:
- Service nghiệp vụ phải biết "khi nào xài V4, khi nào V1" – không có docstring rõ ràng.
- `applyPostLookupPagination` (V1) skip/limit ngoài MongoDB → tải về tất cả rồi mới slice → **rủi ro OOM** ở dataset lớn.
- `processDetailLookups` hardcode `deleted: false` (`database.repository.ts:2528`) còn `processLookups` lại kế thừa từ pipeline gốc → behavior khác nhau cho cùng pattern.

**Đề xuất**:
- Chốt một implementation duy nhất (V4 ưu tiên vì đẩy hết xuống Mongo).
- Đánh dấu V1 `@deprecated` + log warning, lên kế hoạch xóa sau khi migrate hết callsite.
- Bổ sung unit test bộ ba scenario (direct lookup, nested lookup, search via lookup) trước khi xóa.

### 2.4. `@Inject(REQUEST)` ngay trong base repository
```31:50:src/common/database/repositories/database.repository.ts
@Inject(REQUEST) public readonly _request: IRequestWithContext;
```

**Hệ quả**:
- Repository phải nằm scope **REQUEST** → mỗi request tạo lại instance, mất singleton, không dùng được trong worker / cron không có HTTP request.
- Khi `worker/` hoặc PubSub subscriber dùng repository sẽ throw vì `REQUEST` không tồn tại; code đang `if (!this._request) return null;` cho qua → mất audit field silent.

**Đề xuất**:
- Tách ra `AuditContextService` (per-request scoped, hoặc dựa `AsyncLocalStorage`).
- Repository singleton nhận `IAuditContextProvider` qua constructor / setter; provider có 2 implementation: HTTP (đọc REQUEST) và Worker (đọc từ message attributes / job metadata).
- Đảm bảo audit không bị mất khi xử lý background job.

### 2.5. Mutate input trong `create` / `update` / `createMany`
```378:382:src/common/database/repositories/database.repository.ts
data[DATABASE_AUDIT_FIELD.CREATED_BY] = this.getCurrentUserId();
const created = await this._repository.create([data], options);
```

Caller nếu reuse object sẽ ăn audit fields của request trước.

**Đề xuất**: clone trước khi gán hoặc tạo `Object.freeze` payload, hoặc tách thành plain DTO → `toEntity()` mapper.

### 2.6. Hardcode `deleted: false` rải rác
Hầu hết method merge `{ ...find, deleted: options?.withDeleted ?? false }`. Hệ lụy:
- Nếu domain nào không có field `deleted` (vd. log collection), filter này gây lỗi index.
- Soft delete bị **lock cứng** vào base – không thể tắt ở entity không cần.
- `withAvailableDataAndNotDeleted` chỉ áp ở `update`/`softDelete`, các method khác (`exists`, `findOne`, ...) không hỗ trợ → behavior không đồng đều.

**Đề xuất**:
- Tách `SoftDeleteRepository` mixin/decorator. Entity opt-in bằng cách extend `SoftDeletableEntityBase`.
- Cùng một logic `buildDeletedFilter` áp dụng nhất quán trên mọi method (find, findOne, exists, getTotal, aggregate, distinct, ...).
- Cho phép entity tắt soft delete (`@Schema({ softDelete: false })`).

### 2.7. `IDatabaseService` interface khai báo thiếu
`src/common/database/interfaces/database.service.interface.ts` không có `filterDateOverlap` và `filterCompareTwoNumber` mặc dù service đã hiện thực (`database.service.ts:95,117`). Caller dùng abstraction sẽ không thấy method.

**Đề xuất**: Đồng bộ interface, đưa thành contract.

### 2.8. Entity `_id` mặc định khả nghi với ObjectId
```5:9:src/common/database/entities/database.objectId.entity.ts
@DatabaseProp({
    type: String,
    default: new Types.ObjectId(),
})
_id: string;
```

`new Types.ObjectId()` được **đánh giá một lần** khi class load → mọi document mới sẽ chia sẻ ObjectId nếu Mongoose không override. `type: String` mâu thuẫn với `Types.ObjectId`.

**Đề xuất**:
- `default: () => new Types.ObjectId().toString()` (hàm).
- Hoặc dùng `type: SchemaTypes.ObjectId` đúng nghĩa.

### 2.9. `DatabaseEntity` decorator hardcode `timestamps: true`
`src/common/database/decorators/database.decorator.ts:28-33`. Một số collection có thể chỉ cần `createdAt`. Nên cho phép override qua `options`.

### 2.10. `aggregate` ép `deleted: false` trước pipeline
`src/common/database/repositories/database.repository.ts:658-665`. Khi caller cần thống kê data đã xóa hoặc collection không có `deleted`, pipeline phải filter ngược – workaround xấu.

**Đề xuất**: Tham số `withDeleted` đã có; thêm `skipSoftDeleteFilter: true` để bỏ stage này.

### 2.11. `withTransaction` chỉ có ở `database.repository.ts`
File `database.helper.repository.ts` không có. Service nào extend helper sẽ thiếu transaction support.

### 2.12. `DatabaseIndexService.syncAllIndexes` không có scheduler
`src/common/database/services/database.index.service.ts:14`. Service tồn tại nhưng không được gọi ở bootstrap (chỉ register qua provider). Khi entity mới thay đổi index, không có cơ chế tự sync.

**Đề xuất**: Gọi trong `OnApplicationBootstrap` ở môi trường non-production (config gating), production dùng migration script riêng.

---

## 3. Pagination

### 3.1. Pagination DTO trộn 2 mô hình paging
`src/common/pagination/dtos/pagination.list.dto.ts`:
- `page`, `perPage` → offset paging
- `lastTime` → cursor paging

Caller phải tự biết khi nào dùng cái nào, không có discriminator. Repository hiện kiểm tra:
```99:103:src/common/database/repositories/database.helper.repository.ts
if (options?.paging?.lastTime) {
    repository.where('updatedAt').lt(...)
}
```
Nếu cả `lastTime` và `offset` cùng có → chồng chéo, thứ tự không xác định.

**Đề xuất**:
- Tách `PaginationOffsetDto` và `PaginationCursorDto` rõ ràng.
- Ở pipe, throw nếu client gửi cả hai.
- Endpoint khai báo loại paging qua decorator `@PaginationQuery({ mode: 'offset' | 'cursor' })`.

### 3.2. Property prefix `_search`, `_limit`, `_offset` trong DTO
- Không idiomatic NestJS; class-validator/transformer sẽ skip key bắt đầu bằng `_` ở một số version.
- `@ApiHideProperty()` phải đặt thủ công cho từng field – dễ quên.

**Đề xuất**:
- Đặt cờ tính toán này vào field `internal` riêng hoặc kế thừa từ base class `PaginationInternalState`.
- Truyền giữa pipe → controller qua `@Pagination()` parameter decorator có type rõ ràng.

### 3.3. `PAGINATION_DEFAULT_MAX_PAGE = 20`
`src/common/pagination/constants/pagination.constant.ts:8` giới hạn cứng tổng số page tối đa = 20. Với `perPage = 100` (max) thì client tối đa thấy 2.000 record. Không có doc giải thích, dễ gây confusion.

**Đề xuất**: Tách 2 khái niệm `MAX_PAGE_NUMBER` (một request không vào page > N) và `MAX_TOTAL_PAGES` (cho UI). Doc rõ ràng.

### 3.4. `IPaginationOrder` định nghĩa `Record<string, ENUM_PAGINATION_ORDER_DIRECTION_TYPE>`
`ENUM_PAGINATION_ORDER_DIRECTION_TYPE.ASC = 1`, `DESC = -1` – đúng giá trị Mongo. Nhưng nhiều nơi treat `1 | -1` raw (`Record<string, 1 | -1>` ở `extractLookupOrdersFromOptions`). Type không thống nhất.

**Đề xuất**: Một type duy nhất, chuẩn hoá ở pipe.

### 3.5. `PaginationService.search` không escape khi bypass `DatabaseHelperQueryContain`
Service hiện đã dùng `DatabaseHelperQueryContain` (đã có `escapeRegExp`) – OK. Nhưng `_search` được DTO ghi đè trong nhiều pipe (`pagination.search.pipe.ts`), đảm bảo luôn đi qua escape. Cần test xác nhận.

### 3.6. Pagination metadata không generate ở service
Hiện logic build `_metadata` rải ở `ResponsePagingInterceptor`. Nếu API ngoài HTTP (job, message) cần phân trang – không có service `PaginationService.buildMetadata()` tái dùng được.

**Đề xuất**: Bổ sung `PaginationService.buildPagingMetadata({page, perPage, total})` thuần.

---

## 4. PubSub & Background Processing

### 4.1. `publishBatch` không thực sự batch
```110:131:src/common/pubsub/services/pubsub.publisher.service.ts
return this.executeWithRetry(
    () => Promise.all(
        pubsubMessages.map(message => topic.publishMessage(message)),
    ),
    ...
);
```
`Promise.all` 1 message/1 lần publish → không tận dụng batching của `@google-cloud/pubsub` (publisher có sẵn `batching` config: `maxMessages`, `maxMilliseconds`, `maxBytes`).

**Đề xuất**:
- Tạo `Topic` với `publisherOptions.batching` cấu hình từ config.
- Publish lần lượt; client tự gom batch theo time/size.

### 4.2. Auto create topic ở mọi môi trường
```37:42:src/common/pubsub/services/pubsub.publisher.service.ts
const [topicExists] = await topic.exists();
if (!topicExists) {
    await client.createTopic(topicName);
}
```

**Vấn đề**:
- Production thường không cấp quyền `pubsub.topics.create` cho service account → throw không thân thiện.
- Topic được tạo khi runtime gọi → IaC drift, governance khó.

**Đề xuất**:
- Mặc định `false`; bật `PUBSUB_AUTO_CREATE_TOPIC` qua config, chỉ true ở dev/test.
- Production: throw error rõ "topic not found, please provision via terraform/IaC".

### 4.3. Subscriber không có Dead Letter Queue / max delivery attempts
`subscribe()` chỉ set `flowControl`. Khi handler luôn fail → `nack()` lặp vô hạn, message poison.

**Đề xuất**:
- Truyền options `deadLetterPolicy: { deadLetterTopic, maxDeliveryAttempts }`.
- Cho phép cấu hình ack deadline, retry policy.

### 4.4. Tên message handler không strong-typed
```37:43:src/common/pubsub/services/pubsub.subscriber.service.ts
async subscribe(
    subscriptionName: string,
    handler: (message: IPubSubMessage) => Promise<void>,
    ...
```
Mọi subscription dùng cùng `IPubSubMessage` (data: Buffer thô). Mỗi consumer phải tự `JSON.parse(data.toString())` → dễ lỗi schema.

**Đề xuất**:
- Cung cấp generic: `subscribe<TPayload>(name, handler: (msg: IPubSubMessage<TPayload>))` với schema validation (`zod`/`class-validator`).
- Bổ sung `OutboxPattern` nếu cần đảm bảo at-least-once với DB transaction.

### 4.5. Worker không có entry point
`src/worker/` rỗng. Hiện app chạy chung HTTP + subscribers → khó scale theo loại workload, khó deploy riêng.

**Đề xuất**:
- Tạo `src/worker/worker.module.ts` riêng + `src/worker/main.ts` (`NestFactory.createApplicationContext`).
- Cấu hình deploy 2 service: `api` (HTTP) và `worker` (consumers + cron).
- HTTP module **không** auto subscribe – chuyển hết subscriber init sang `worker`.

### 4.6. `OnApplicationShutdown` chỉ ở subscriber
Publisher giữ `topicCache: Map<string, Topic>` không clear khi shutdown. Không gọi `pubSubClient.close()`.

**Đề xuất**: Thêm `OnApplicationShutdown` ở publisher + đóng client gracefully.

---

## 5. Redis & Cache

### 5.1. `RedisService` ép `JSON.parse` mọi giá trị
```44:51:src/common/redis/services/redis.service.ts
private parse<T>(data: string | null): T | null {
    ...
    try { return JSON.parse(data) as T; }
    catch { return data as any; }
}
```
- `as any` phá type contract.
- String "1" sẽ thành number `1` thay vì string. Nếu caller set `'true'` rồi get sẽ ra boolean.

**Đề xuất**:
- Hai API riêng: `getString`, `getJson<T>()`.
- Đừng auto detect; mỗi caller chỉ định kiểu mong đợi.

### 5.2. Không có abstraction cache layer
Hiện chỉ có `Redis` raw + `RedisService`. Module nghiệp vụ sẽ tự build key prefix → drift quy ước.

**Đề xuất**:
- Tạo `CacheService<T>` với namespace, TTL chuẩn, helper `wrap(fn, key, ttl)`.
- Tích hợp `@nestjs/cache-manager` đã cài sẵn (`package.json:28`) hoặc bỏ dependency thừa.

### 5.3. `keys()` dùng `client.keys(pattern)` – nguy hiểm production
`src/common/redis/services/redis.service.ts:84-93`. Lệnh `KEYS` blocking O(N) trên Redis – production với hàng triệu key sẽ stall.

**Đề xuất**:
- Đổi sang `SCAN` (non-blocking).
- Hoặc throw `Method blocked in production` khi NODE_ENV=production.

### 5.4. `mset` không hỗ trợ TTL
`mset` chỉ flat key/value, để TTL phải `setMany`. Nếu caller dùng `mset` rồi mong TTL → mất TTL silent.

**Đề xuất**: Đặt deprecation hoặc bắt buộc TTL.

### 5.5. Module không có distributed lock
Khi mở rộng (rate limit, idempotency, scheduled job), cần lock distributed. Hiện không có abstraction Redlock.

**Đề xuất**: `RedisLockService.acquire(key, ttl)` để chuẩn bị sẵn.

---

## 6. Configuration & Environment

### 6.1. Không validate env schema
`src/configs/index.ts` chỉ load `registerAs(...)`. Nếu thiếu/sai env (ví dụ `DATABASE_URL` rỗng), app start nhưng crash sau – khó debug.

**Đề xuất**:
- Bật `ConfigModule.forRoot({ validationSchema: ... })` với `joi` hoặc dùng `class-validator` cho `AppEnvDto` đã có (`src/app/dtos/app-env.dto.ts`).
- Fail fast tại bootstrap, log rõ env nào thiếu.

### 6.2. Path config không thống nhất qua constants
- `app.module.ts:30,32` dùng `MIDDLEWARE_CONFIG_PATH.THROTTLE_TTL`, `THROTTLE_LIMIT`.
- `database.options.service.ts:13-19` dùng string literals (`'app.env'`, `'database.url'`, `'database.timeoutOptions'`).
- `redis.module.ts` dùng `REDIS_CONFIG_PATH.CACHED.URL` – tốt.

→ Mix 2 phong cách. Khi rename config key, một nửa file bị miss.

**Đề xuất**: Tạo `CONFIG_PATH` cho mọi nhóm; lint rule cấm dùng string literal `configService.get('xxx.yyy')` (eslint custom).

### 6.3. Thiếu `MESSAGE_*`, `ENCRYPTION_*` trong file config
- `src/configs/encryption.config.ts` có nhưng không tham chiếu `process.env.ENCRYPTION_AES_ENABLE` ở filter logic.
- `MESSAGE_DEFAULT_LANGUAGE`, `MESSAGE_AVAILABLE_LANGUAGES` ở `.env.example` nhưng `message.config.ts` cần check map đầy đủ.

**Đề xuất**: Audit lần lượt `*.config.ts` ↔ `.env.example` đảm bảo 1-1.

### 6.4. `tsconfig.json` không strict
```22:26:tsconfig.json
"strictNullChecks": true,
"forceConsistentCasingInFileNames": true,
"noImplicitAny": false,
"strictBindCallApply": false,
"noFallthroughCasesInSwitch": false
```

`strict: true` không bật. Khi codebase mở rộng, type inference yếu sẽ làm hỏng refactor lớn.

**Đề xuất**:
1. Bật `"strict": true` (hoặc từng flag) **trước khi** thêm module mới.
2. Bật `"noUncheckedIndexedAccess": true` để bắt `arr[0]` undefined.
3. Bật `"exactOptionalPropertyTypes": true` để hợp `?: T | undefined` không lẫn lộn.
4. Bật `"noImplicitOverride": true` cho base class.

### 6.5. ESLint config tối thiểu
`eslint.config.mjs` (934 bytes) – khả năng chỉ là default. Cần:
- Ràng buộc `no-floating-promises`, `consistent-return`.
- Plugin `eslint-plugin-import` để chống import cycle (đặc biệt `common ↔ app`).
- `eslint-plugin-unused-imports`, `eslint-plugin-promise`.

---

## 7. Response / Request / Error format

### 7.1. Header & metadata mismatch (success vs error)

| Trường | Success interceptor | Error filter / `ErrorResponseHeader` |
|--------|---------------------|--------------------------------------|
| Language | `x-custom-lang` | `x-lang` |
| Timestamp | `x-timestamp` (number) | `x-at` (ISO string) |
| Timezone | `x-timezone` | `x-tz` |
| Version | `x-version` | `x-api-ver` |
| Release / repo | `x-repo-version` (`repoVersion`) | `x-release` (`release`) |

Khách hàng phải parse 2 hợp đồng. Middleware CORS chỉ allow `x-lang` (`middleware.config.ts:46`) – success header đang **không CORS-allowed**.

**Đề xuất**: chốt bộ header chuẩn (đề nghị `x-lang`, `x-timestamp`, `x-tz`, `x-api-version`, `x-release`); update i18n resolver, CORS, Swagger doc, success/error interceptor về cùng một bộ.

### 7.2. Hai interface `IResponseMetadata`
- `src/app/interfaces/app.interface.ts`
- `src/common/response/interfaces/response.interface.ts`

→ Khi sửa shape phải nhớ đồng bộ cả hai. Có khi field đã drift (`release` vs `repoVersion`).

**Đề xuất**: 1 interface duy nhất ở `core/shared`, hoặc `common/response` re-export, app import từ đó.

### 7.3. Trùng lặp 3 interceptor paging
- `ResponseInterceptor`
- `ResponsePagingInterceptor`
- `ResponseLookupPagingInterceptor`

~90% logic giống nhau. Khác biệt: validation `data` array vs object lookup.

**Đề xuất**:
- Base abstract `BaseResponseInterceptor` chứa metadata + headers + currentLanguage logic.
- Subclass override `transformPayload(data)`.

### 7.4. `IRequestApp` ↔ `IRequestWithContext`
Hai interface định nghĩa cùng concept (`request + context`):
- `request.interface.ts:4-12`: `__language`, `__pagination`, `__user?: any`
- `request-with-context.interface.ts:3-10`: `requestId`, `user?: { _id }`

Middleware ghi sang interface này, interceptor đọc interface kia → bug ngầm khi rename field.

**Đề xuất**:
- Một interface duy nhất `IAppRequest extends Request` chứa toàn bộ context.
- Middleware/interceptor cùng dùng.
- `__user` dùng `any` → đổi sang `IRequestUser` typed.

### 7.5. Header ngôn ngữ 3 nơi khác nhau
- Middleware `AppCustomLanguageMiddleware` đọc `x-lang`.
- I18n `MessageModule` resolver `['x-custom-lang']`.
- Success interceptor set `x-custom-lang`.
- Swagger Doc decorator dùng `x-custom-lang`.
- CORS chỉ allow `x-lang`.

→ Client gửi `x-custom-lang` qua CORS sẽ bị reject; còn middleware không nhận. Client gửi `x-lang` thì I18n không nhận diện → fallback default.

**Đề xuất**: Một header thống nhất + update CORS + nhập env.

### 7.6. `RequestValidationException` extends `Error`
```5:8:src/common/request/exceptions/request.validation.exception.ts
export class RequestValidationException extends Error {
    readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST;
```

Không extends `HttpException` → `getStatus()` không có sẵn; filter phải biết về exception cụ thể. ValidationPipe set `errorHttpStatusCode: UNPROCESSABLE_ENTITY (422)` (`request.module.ts`) nhưng exception trả 400.

**Đề xuất**: extends `HttpException` hoặc `BadRequestException`; thống nhất 422 nếu chọn UnprocessableEntity.

### 7.7. `console.log` còn sót
`src/common/response/decorators/response.duration.decorator.ts:11` – `console.log('Data Object', obj)`.

### 7.8. CSV export chỉ lấy `data[0]`
`response.file.interceptor.ts:83-85`. Multi-sheet bị bỏ qua silently.

### 7.9. `AsyncLocalStorage` chứa service instance
`src/common/response/contexts/request-async-local-storage.context.ts:7-14` lưu `MessageService`, `HelperCurrencyService`, `Map<string, ITimezoneAndLocale>`.

**Vấn đề**:
- ALS phải primitive – store service khiến không cleanup, leak memory.
- Khó test (không inject mock được khi service nằm trong context).

**Đề xuất**: ALS chỉ chứa `language`, `version`, `branchId`, `requestId`. Service inject qua DI thông thường.

---

## 8. Encryption / Security

### 8.1. `ChecksumInterceptor` đăng ký global
`src/common/encryption/encryption.module.ts:24-27` register `APP_INTERCEPTOR` → áp dụng cho **mọi** controller.
- GET / health check không có body → destructure `{ data, checksum } = req.body` throw runtime.
- Webhook không thể thêm body checksum → chặn integration.

**Đề xuất**:
- Reflector + custom decorator `@UseChecksum()` opt-in.
- Hoặc whitelist HTTP method (POST/PUT/PATCH only).

### 8.2. `RequestDecryptInterceptor` không đọc IV từ body
Response set `{ data, iv }` (`response.encrypt.interceptor.ts:120`); request decrypt dùng `fallbackIv` trong config (`request.decrypt.interceptor.ts:92-102`). Nếu cả hai end-to-end E2E thì IV phải đi kèm payload, không thể static.

**Đề xuất**: Đọc IV từ `request.body.iv` (hoặc header), fallback config chỉ cho dev.

### 8.3. `request.body = undefined` khi không có IV
```91:105:src/common/encryption/interceptors/request.decrypt.interceptor.ts
if (this.fallbackIv) {
    decryptedData = this.helperEncryptionService.aes256DecryptWithIv(...);
}
request.body = decryptedData;
```
Không có nhánh `else` → body bị wipe. Validation pipe sẽ throw không liên quan đến encryption.

### 8.4. AES key không validate length
`HelperEncryptionService.aes256EncryptWithIv` dùng `createCipheriv('aes-256-cbc', key, iv)` với `key` là string raw. AES-256 yêu cầu **32 bytes**. Nếu env config 16 ký tự thì throw cryptic.

**Đề xuất**: Validate `Buffer.byteLength(key) === 32` lúc bootstrap; báo lỗi rõ.

### 8.5. JWT default secret hardcode
`helper.module.ts:57` fallback `'omnichat-default-secret'`. Production thiếu env → secret yếu.

**Đề xuất**: Throw nếu thiếu env JWT secret ở production; kèm validation schema.

### 8.6. Encrypt fail trả plaintext silent
`response.encrypt.interceptor.ts:127-131` catch error rồi trả `responseData` chưa mã hóa. **Rò rỉ data** ở production khi pipeline lỗi.

**Đề xuất**: Throw `InternalServerErrorException` thay vì trả plaintext.

### 8.7. Checksum dùng `JSON.stringify` không stable
Order key thay đổi giữa client/server → hash mismatch. Cần normalize (vd. `safe-stable-stringify`).

### 8.8. Header `X-Disable-Encryption` đảo logic
`response.encrypt.interceptor.ts:83-90`:
```
(disableEncryption === 'true' || !disableEncryption) && env !== production
```
Non-prod default skip encryption – ngược trực giác. Header chỉ ý nghĩa ở production.

**Đề xuất**: Tài liệu hóa rõ; rename biến `forceDisable` cho khớp.

---

## 9. File / R2 / Firebase Storage

### 9.1. `FileImportException` trùng tên ở 2 module
- `src/common/file/exceptions/file.import.exception.ts` (pipe throw)
- `src/app/exceptions/file-import.exception.ts` (filter `AppValidationImportFilter` catch)

→ `instanceof` mismatch → exception import excel rơi vào `AppGeneralFilter` (500), client không thấy thông tin lỗi import.

**Đề xuất**: Một class duy nhất, một module owner (đề xuất `common/file`), filter import từ đó.

### 9.2. `FileExcelValidationPipe` validate sai cách
```47:48:src/common/file/pipes/file.excel-validation.pipe.ts
const dto: T[] = plainToInstance(classDtos, parse.data);
const validator: ValidationError[] = await validate(dto);
```
`class-validator.validate()` cần **instance** không phải mảng. Code hiện tại có thể bỏ qua validation cho từng row → import sai data vẫn pass.

**Đề xuất**:
- Loop từng row: `for (const row of dto) await validate(row)`.
- Aggregate error có index row.

### 9.3. R2 vs Firebase storage duplicate
`r2.service.ts` và `firebase-storage.service.ts` có cùng pattern `generateObjectKey`, batch upload/delete. Khi cần thay storage backend phải refactor 2 chỗ.

**Đề xuất**:
- Định nghĩa interface `IObjectStorageService` (upload, delete, getSignedUrl, listFiles).
- 2 implementation; `FileService` inject qua token, chọn theo config.

### 9.4. Firebase `initializeApp` trong constructor
Side-effect global ở module load → khó test, multi-tenant.

**Đề xuất**: `OnModuleInit`, có guard nếu `app.initialized()`.

### 9.5. R2 `deleteFile` parse URL không validate host
`r2.service.ts:183`. URL malicious từ client → có thể xóa object thuộc bucket khác (nếu tin tưởng URL ngoài).

**Đề xuất**: Whitelist host = endpoint của bucket trước khi parse.

### 9.6. `AppRawBodyParserMiddleware` / `AppTextBodyParserMiddleware` định nghĩa nhưng không register
`app.body-parser.middleware.ts:45-73` – dead code.

**Đề xuất**: Hoặc register, hoặc xóa.

---

## 10. Helper module

### 10.1. Vi phạm SRP
Module gom: encryption, JWT, Firebase, HTTP throw, phone, currency, date branch logic, array, object compare, hash. Workspace rule yêu cầu "không util chung cho luồng nghiệp vụ" – đang có dấu hiệu vi phạm.

**Đề xuất**:
- Tách thành các module độc lập: `encryption`, `auth-token`, `firebase`, `phone`, `currency`, `date`, `array-helper`, `hash`.
- Helper chỉ giữ những hàm pure không phụ thuộc framework.

### 10.2. Bug Luxon `startOf/endOf`
```103:108:src/common/helper/services/helper.date.service.ts
mDate.startOf('day');
} else if (...) {
mDate.endOf('day');
```
Luxon `DateTime` immutable – cần gán lại `mDate = mDate.startOf('day')`. Hiện option `dayOf` không có hiệu lực, silent.

### 10.3. `getLocaleAndUtc(branch: DocumentData)`
`helper.date.service.ts:286-293` import `DocumentData` của Firestore. Common module không nên biết Firestore shape.

### 10.4. `console.error` trong `HelperHttpService`
Đề nghị dùng Nest `Logger`.

### 10.5. Đôi crypto stack (`crypto` Node + `crypto-js`)
Hai cách AES → khó audit, dễ lệch behavior. Đề nghị chỉ dùng Node `crypto`.

---

## 11. Validation / Decorator chéo

### 11.1. Date validators copy-paste sai tên decorator
```27:28:src/common/request/validations/request.date.less-than-property.validation.ts
registerDecorator({
    name: 'DateGreaterThanEqualProperty',
```
Tên đăng ký sai so với hàm. Constraint registry conflict → message map lỗi, debug nhầm.

### 11.2. So sánh date bằng string
`request.date-greater-than.validation.ts:17` so sánh `string >= Date`. Không parse, không xét timezone.

### 11.3. `@ValidatorConstraint({ async: true })` cho validator sync
Overhead Promise không cần thiết.

### 11.4. `forbidNonWhitelisted: false`
`src/common/request/request.module.ts` (config ValidationPipe). Client gửi field thừa pass silently.

**Đề xuất**: bật `forbidNonWhitelisted: true` cho strict API; nếu cần linh động thì document.

### 11.5. `IsFutureDate` boundary inclusive
`is-future-date.decorator.ts:22` cho phép `>= now` – tên sai nghĩa.

### 11.6. `is-not-same-as`, `is-future-date` hard-code English message
Bypass i18n → phá pattern (`request.*` đang dùng key i18n).

### 11.7. `ExistsDBPipe` chứa logic DB trong common
`src/common/request/pipes/request.exists.db.pipe.ts:57-60` truy cập `databaseConnection.models[entityName]`.
- `entityName` dynamic – không validate.
- `isBranch` hard-code `branchId` – domain Omnichat multi-branch.
- `request: any`, `searchConditions: any`.

**Đề xuất**: Chuyển sang module domain; common chỉ giữ `ExistsPipe` generic inject `IExistsRepository`.

---

## 12. App layer (filters / middlewares / bootstrap)

### 12.1. `main.ts` thiếu hardening
```7:28:src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  ...
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({...});
  await app.listen(port);
}
```

Còn thiếu:
- `app.enableShutdownHooks()` để OnApplicationShutdown chạy đúng (worker subscriber, redis quit, mongo close).
- `app.set('trust proxy', 1)` (express) cho rate limit, IP detection sau load balancer.
- `setGlobalPrefix` không exclude `health` → health probe bị prefix.
- Không có Swagger setup (mặc dù `@nestjs/swagger` đã cài).
- Không có `process.on('uncaughtException', ...)` / `unhandledRejection`.
- Không log `release`, `env`, `git commit`.

**Đề xuất**: Tách `src/app/bootstrap/` thành các function nhỏ: `setupSwagger`, `setupValidation`, `setupShutdown`, `setupSecurity`. `main.ts` chỉ orchestrate.

### 12.2. `AppGeneralFilter` log full exception
```29:29:src/app/filters/app.general.filter.ts
this.logger.error(exception);
```
- Không log `requestId` → khó trace.
- Có thể log sensitive (body, headers) nếu exception kèm.

**Đề xuất**: Log structured `{ requestId, method, path, status, message, stack }`; sanitize body theo allowlist.

### 12.3. `AppGeneralFilter` xử lý `HttpException` thô
```31:34:src/app/filters/app.general.filter.ts
if (exception instanceof HttpException) {
    httpAdapter.reply(res, exception.getResponse(), exception.getStatus());
    return;
}
```
- Bypass `AppHttpFilter` format response → metadata, header không apply.
- Thứ tự filter trong NestJS phụ thuộc thứ tự register trong `app.middleware.module.ts:20-23`. Nest áp filter từ phải qua trái với decorator nhưng với `APP_FILTER` provider thứ tự chạy theo Reflector – nguy cơ overlap.

**Đề xuất**: `AppGeneralFilter` chỉ xử lý `unknown` (Catch không type), không touch HttpException.

### 12.4. `AppHttpFilter` redirect non-API path
`app.http.filter.ts:39-41` – API gọi sai prefix bị redirect 308 đến landing page. Client gọi sai URL kỳ vọng 404 JSON.

**Đề xuất**: Nếu là JSON request (header Accept = application/json) → trả 404, else mới redirect.

### 12.5. `AppRequestIdMiddleware` không gắn header response
Set `req.requestId` nhưng không `res.setHeader('x-request-id')`. Distributed trace không liên kết được.

### 12.6. `AppCorsMiddleware` `origin: true` + `credentials: true` (mặc định env)
`.env.example:23` `CORS_ORIGIN=*`, mà `cors` package treat `'*'` thành reflect any nếu credentials.

**Vấn đề**: rủi ro CSRF khi dùng cookie auth. Production cần whitelist explicit.

### 12.7. `AppHelmetMiddleware` không tune CSP
`app.helmet.middleware.ts:7` – default helmet. Khi setup Swagger UI sẽ bị CSP block inline script. Cần config CSP riêng cho `/api/docs`.

### 12.8. Filter / middleware module phụ thuộc nhiều dependency
`AppMiddlewareModule` phải khai trong cả `providers` lẫn `consumer.apply(...)`. Khi quên là middleware không chạy.

**Đề xuất**: Define một mảng `MIDDLEWARE_CHAIN` duy nhất rồi `consumer.apply(...MIDDLEWARE_CHAIN).forRoutes('*')`.

### 12.9. `RoutesUserModule` có path `''` nhưng đăng ký global `RouterModule`
`router.module.ts:11` map module `''` – nếu thêm controller vào `RoutesUserModule` sau này thì controller được áp luôn route mặc định, dễ xung đột với `RoutesAdminModule` / `RoutesPublicModule`.

**Đề xuất**:
- Đặt prefix rõ ràng (`user/`) hoặc dùng strategy: public/admin có prefix, user không. Document quy ước.

### 12.10. `RoutesUserModule` và `RoutesAdminModule` rỗng hoàn toàn
Không nguy cấp nhưng cần plan: khi thêm module nghiệp vụ, đăng ký ở đâu? Quy ước "user/admin/public" theo controller hay theo module?

**Đề xuất**: Document 1 trong 2 quy ước:
1. Mỗi domain module export `*.controller.ts` rồi `RoutesUserModule`/`RoutesAdminModule` chỉ tổng hợp.
2. Domain module chia sẵn controller user/admin riêng.

---

## 13. Documentation, testing, DX

### 13.1. README còn template Nest mặc định
`README.md` chưa có thông tin domain Omnichat: stack, run worker, run subscriber, config env, kiến trúc thư mục.

**Đề xuất**: viết README chuẩn (architecture diagram, các biến env quan trọng, lệnh dev/prod, troubleshooting).

### 13.2. Không có test
- `test/` rỗng (chỉ có e2e config từ template).
- `package.json` có script `test:e2e` nhưng chưa setup.

**Đề xuất**:
- Coverage tối thiểu cho `database.repository`, `pagination`, `pubsub`, `helper.date`, `helper.encryption`.
- Setup CI gate.

### 13.3. Thiếu CI / pre-commit
Không có `.github/workflows/` hoặc `husky`. Khi nhiều dev cùng làm, dễ break.

**Đề xuất**: Husky + lint-staged + commitlint (Conventional Commits) + GitHub Actions chạy `lint`, `test`, `build`.

### 13.4. Không có doc kiến trúc / decision log
Khi codebase scale > 10 module, các quyết định quan trọng (vd. paging, soft delete, lookup engine) cần Architecture Decision Record (ADR).

**Đề xuất**: tạo `refs/docs/adr/` lưu các ADR.

### 13.5. Không có script seed dev / migration
Không có `scripts/seed.ts`, không có migration framework. Thay đổi schema mongoose chỉ chạy `syncIndexes()` runtime.

**Đề xuất**:
- Dùng `migrate-mongo` hoặc viết minimal migration runner.
- Seed script cho dev local.

---

## 14. Quan sát chéo & rủi ro phát sinh khi scale

| Tình huống tương lai | Rủi ro hiện tại | Việc cần chốt sớm |
|----------------------|------------------|-------------------|
| Thêm 10 domain module | Base repository trùng lặp, lookup engine khó debug | Refactor `DatabaseRepositoryBase` (mục 2). |
| Triển khai worker riêng | Repository scope REQUEST throw vì không có HTTP request | `AuditContextService` (mục 2.4). |
| Thêm OAuth / JWT | JWT secret yếu, không có guard chuẩn | Auth module + RolesGuard (mục 1.3, 10). |
| Bật E2E encryption end-to-end | Thiếu IV per request, fallbackIv leak | Refactor encryption interceptor (mục 8). |
| Multi-tenant / multi-branch | Logic branch hard-code trong common (`ExistsDBPipe`, decorator timezone) | Tách domain branch ra module riêng (mục 11.7, 7.x). |
| Triển khai gRPC / GraphQL | Response format gắn vào HTTP filter | Tách response builder service – tái dùng cho transport khác. |
| Scale tới hàng triệu record | Pagination + lookup V1 load all in memory | Bỏ V1, ép V4 (mục 2.3). |
| Audit trail / event sourcing | Chưa có outbox / event publishing pattern | Pubsub outbox + transaction (mục 4.4). |

---

## 15. Lộ trình đề xuất (3 giai đoạn)

### Giai đoạn 1 – "Trước khi thêm module nghiệp vụ" (1-2 sprint)
1. Bật `tsconfig.strict`, gỡ `@ts-nocheck` ở repository (refactor base).
2. Thống nhất `IRequestContext`, header chuẩn, metadata chuẩn.
3. Sửa các bug rủi ro cao: `HelperDateService.startOf/endOf`, decorator name copy-paste, `FileImportException` trùng.
4. Tách `ChecksumInterceptor` thành opt-in.
5. Định nghĩa cấu trúc `src/modules/`, `src/worker/`, `src/common/queues/` (template + ADR).
6. Validate env schema bootstrap.

### Giai đoạn 2 – "Khi mở rộng" (2-4 sprint)
1. Tách `LookupQueryBuilder` ra service riêng, deprecate V1.
2. Tách `Helper` thành sub-module nhỏ.
3. Xây `CacheService`, `RedisLockService`.
4. Build worker entry point + ADR cho job/event pattern.
5. Hoàn thiện CI/CD, husky, lint-staged.

### Giai đoạn 3 – "Hardening trước go-live" (sau khi có domain modules)
1. Migration framework + seed.
2. Swagger doc đầy đủ.
3. Distributed tracing (OpenTelemetry), structured logging.
4. Security review (helmet CSP, CORS allowlist, rate limit per route).
5. E2E test suite tối thiểu cho auth flow + critical path.

---

## 16. Phụ lục – Nhật ký phát hiện theo file (trích nhanh)

| File | Vấn đề chính |
|------|--------------|
| `src/main.ts` | Thiếu shutdown hooks, swagger, trust proxy |
| `src/app/app.module.ts` | OK, nhưng nên import `ScheduleModule`/`HealthModule` từ sớm |
| `src/app/filters/app.general.filter.ts:29` | Log raw exception |
| `src/app/filters/app.http.filter.ts:39-41` | Redirect non-API path |
| `src/app/filters/app.validation-import.filter.ts:7` | Import `FileImportException` từ app, không match common |
| `src/common/database/repositories/database.repository.ts:1` | `@ts-nocheck`, ~2.600 dòng |
| `src/common/database/repositories/database.objectId.repository.ts:1` | Copy của trên, lệch `getCurrentUserId` |
| `src/common/database/repositories/database.helper.repository.ts:1` | Bản fork thiếu nhiều method |
| `src/common/database/entities/database.objectId.entity.ts:5-9` | `default: new Types.ObjectId()` shared |
| `src/common/database/services/database.options.service.ts:13-19` | Path config string literal |
| `src/common/database/decorators/database.decorator.ts:28-33` | `timestamps: true` cứng |
| `src/common/database/interfaces/database.service.interface.ts` | Thiếu method |
| `src/common/pagination/dtos/pagination.list.dto.ts` | Trộn cursor + offset, prefix `_` |
| `src/common/pagination/constants/pagination.constant.ts:8` | `MAX_PAGE = 20` không document |
| `src/common/pubsub/services/pubsub.publisher.service.ts:37-42,110-131` | Auto create topic + batch giả |
| `src/common/pubsub/services/pubsub.subscriber.service.ts:35-84` | Không DLQ, handler không type |
| `src/common/redis/services/redis.service.ts:44-51,84-93` | Auto JSON parse, dùng KEYS |
| `src/common/encryption/encryption.module.ts:24-27` | Checksum global |
| `src/common/encryption/interceptors/request.decrypt.interceptor.ts:91-105` | IV không từ body, body=undefined |
| `src/common/encryption/interceptors/response.encrypt.interceptor.ts:127-131` | Fail trả plaintext |
| `src/common/file/exceptions/file.import.exception.ts` | Trùng tên với `src/app/exceptions` |
| `src/common/file/pipes/file.excel-validation.pipe.ts:47-48` | Validate array sai cách |
| `src/common/helper/services/helper.date.service.ts:103-108` | Bug Luxon immutable |
| `src/common/helper/helper.module.ts:57` | JWT secret hard-code default |
| `src/common/request/exceptions/request.validation.exception.ts:5-8` | Extends `Error` |
| `src/common/request/validations/request.date.less-than-property.validation.ts:27-28,55-56` | Tên decorator copy sai |
| `src/common/response/decorators/response.duration.decorator.ts:11` | `console.log` debug |
| `src/common/response/contexts/request-async-local-storage.context.ts:7-14` | ALS chứa service instance |
| `src/router/routes/routes.user.module.ts` | Module rỗng, route prefix `''` |
| `src/router/routes/routes.admin.module.ts` | Rỗng |
| `src/worker/`, `src/modules/`, `src/common/queues/` | Thư mục rỗng |
| `tsconfig.json:22-26` | `noImplicitAny: false`, không strict |
| `README.md` | Template Nest |

---

> **Khuyến nghị sử dụng**: Mỗi mục trong checklist có thể tách thành 1 ticket riêng. Trong sprint planning, ưu tiên kéo các mục **Cao** ở phần 1, 2, 7, 8 trước khi đẩy module nghiệp vụ – chi phí refactor về sau sẽ giảm rất nhiều.










