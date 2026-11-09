# SRVF 简单提审确认：前端最小合同与源码依据

这是自包含跨线程交接文件；不要求读取另一线程的 /workspace。来源仓库 BA7IEE/srvf-nest-api，独立分支 fix/simple-submit-confirmation，基线 15421e9c3c1d3468b57755ae5fdea526934f4e19。增量尚未提交、未推送、没有新PR或部署；不能将基线SHA当作已经包含此功能的远端提交。

当前候选完整补丁 SHA-256：93ed4091f2be3e22786140ea12438bd60d1818d8d887b6d9064a432e8f1725c7。本文片段从该工作树直接截取，附路径、行号和文件摘要；禁止仅在公开基线中查到同名文件便认为新合同已上线。前端接入须与该后端候选同步，旧后端可能拒绝新增字段；不能因此自动降级为省略确认版本。

## 1. URL、响应与字段位置

所有路径都含全局 /api 前缀，使用当前登录人的现有认证。

| 操作 | 方法和路径 | 成功 |
|---|---|---|
| 读取简单草稿，可用同一路径轮询 | GET /api/admin/v1/activities/:id/simple-draft | HTTP200，{code:0,message:"ok",data:AdminSimpleDraftResponseDto} |
| 原子完整保存 | PUT /api/admin/v1/activities/:id/simple-draft | HTTP200，同一响应DTO；返回保存后的服务端最终事实 |
| 提交发布审核 | POST /api/admin/v1/activities/:id/publish-reviews | HTTP200，{code:0,message:"ok",data:ActivityPublishReviewResponseDto}；成功不等于活动published |

读取和保存的指纹都是 HTTP JSON body 的 `data.draftHash`，即 AdminSimpleDraftResponseDto 顶层属性。格式：字符串，64位小写十六进制，`^[0-9a-f]{64}$`。如果应用使用Axios原始Response，可能是 response.data.data.draftHash；如果调用本仓生成客户端，它返回 ApiEnvelope，因此是 envelope.data.draftHash。须按前端自己的fetcher解包层次核实，不能双重或遗漏解包。

同一DTO还有 activityId、title、organizationId、activityTypeCode、allocationModeCode、startAt、endAt、location、instance、statusCode、review、editable、selectedTemplateVersionId、definitionHash、session、position、places、policies。`data.definitionHash`是模板定义摘要，虽然也是64位，**不能**代替draftHash。review仅有最新审核id/status/requestType；为null表示尚无审核。

PUT请求的 `expectedDraftHash` 也在body顶层，但它是**必填**。PUT还必须携带完整目标事实、instance和places，不能当作局部PATCH。成功PUT返回值与GET共用present方法；等待保存成功后，用服务端返回的最终事实重建确认预览，不使用仍在编辑的本地表单值。

## 2. 提审请求（新前端应始终携带确认版本）

```ts
// server DTO: expectedDraftHash可省略，仅为兼容旧客户端。
interface SubmitSimpleReviewBody {
  operationKey: string;        // 必填字符串，8..128字符；生成全局唯一值并保留
  confirmation: true;          // 必填JSON boolean true，不接受false或字符串"true"
  expectedDraftHash?: string;  // body顶层；仅省略合法，null不合法
}

// 前端确认后的新调用：confirmedDraft是用户实际确认的同一份GET/PUT响应data
const submittedBody = {
  operationKey: newOperationKey,
  confirmation: true,
  expectedDraftHash: confirmedDraft.draftHash,
};
// POST /api/admin/v1/activities/{confirmedDraft.activityId}/publish-reviews
// 持久保存此次意图的activityId + submittedBody，供响应丢失时重试。
```

expectedDraftHash由 `@OmittableOnly()`（只跳过undefined）、`@IsString()`、`@Matches(/^[0-9a-f]{64}$/)`校验，服务还做相同格式防御。没有trim、大小写转换或前端重算协议。null、空串、任意非hex文字、64位大写hex、数字均为HTTP400/BizCode40000；既有数据库用例已覆盖这些输入。未知body属性由全局forbidNonWhitelisted拒绝。字段不是query、header、嵌套confirmation对象，也不是If-Match。

## 3. operationKey与精确重放

提供确认版本时，服务计算的请求指纹等价于：

```ts
hashCanonical({
  action: 'publish-review-submit:initial',
  activityId,
  payload: { operationKey, confirmation: true, expectedDraftHash },
});
```

省略版本时，payload**完全不含**expectedDraftHash字段，保留原哈希字节形状。hashCanonical排序对象键，所以“精确”是规范化请求语义相同，不要求JSON键顺序一致。operationKey本身也进入payload；数据库按全局唯一operationKey查审核记录，不是每个活动单独一套命名空间。

现有Activity行锁事务里先复核身份/权限/责任资格，再查同键记录并比较完整requestHash。命中才返回同一review；仅新请求检查资格规则、当前simple指纹、状态及最终proposal白名单。成功提审会改变simple hash中的review部分，因此必须先replay，不能拿提交后的新hash检验旧成功请求。

前端规则：
- 网络失败/响应丢失/结果未知时，原activityId、operationKey、confirmation、expectedDraftHash原样重试；不能自动生成新键，也不能把轮询返回的新hash换入旧键。
- 已成功键改hash或移除hash：HTTP409/20143；不同活动复用相同键也不允许。confirmation不为true会先被DTO拒绝。
- 原样重试即使当前GET变为pending/editable=false，仍是恢复同一请求结果的有效路径；不要用“不能新提审”误阻止这条恢复路径。
- 失败的20255/20256没有创建review回执；真实用例证明20255刷新并重新确认后可复用未落库的失败键。产品可为新的确认意图生成新键，但不能把一次结果未知的提交当作已失败。
- 审核退回后再次发起属于新意图：读取当前事实、用户重新确认、使用新键。复用旧成功键只会找到原review。
- 重放仍要求当前授权；撤权或非本人可先得到403/404。重放返回同一审核记录的当前DTO，之后审核状态若改变，不保证响应字节永远等于首次返回；它不是新增审核、也不代表当前所有配置重新通过白名单。

### 3.1 旧标签页两字段未知请求（必须保留原形状）

旧记录可能是 `{operationKey, confirmation:true}`，没有expectedDraftHash。不能把当前GET的hash补进去再称为“恢复”：如果旧请求已成功会成为20143，如果旧请求尚未成功则可能按新语义创建另一种请求；两种情况都不是原两字段请求的精确恢复。也不能补null、替换键或按新客户端默认schema重写旧payload。

建议恢复记录保存activityId、登录身份上下文、原始body和本地payload种类（legacy-two-field / confirmed-three-field）；该种类只是前端元数据，不能附加到POST请求体。旧两字段的唯一写恢复是原两字段原样POST，但它可能在此前根本没落库时首次提交“锁内最新草稿”，没有本轮确认保护。若新前端策略不允许这种旧语义，须保留legacy未知记录，仅做读取与人工核对，不能静默升级或宣称取消成功。

当前GET simple-draft不返回operationKey/requestHash；Review DTO和现有列表过滤也未提供按此operationKey查询提交结果的合同。因此“看到最新review/pending/approved”“没有最新review”“当前hash变了”等一般读取结果，不能单独证明旧未知请求成功、失败或已取消。若已有可信来源把一个reviewId准确关联到原operationKey，才可基于该关联处理结果；不能仅按最新review猜测关联。

### 3.2 三字段未知恢复：20255/20256究竟证明什么

前提必须同时成立：调用的是本候选的Admin POST；activityId和原三字段完全一致；响应确实属于这次恢复尝试（不是PUT、别的轮询、旧标签页或被客户端改写后的请求）；当前登录人授权检查已通过。

本候选的顺序是：Activity锁 → 当前授权/身份与现有前置检查 → findSubmitReplay(operationKey, requestHash) → 资格20256/版本20255 → 构建snapshot并复核引用/授权 → 白名单20256 → create review。全src符号检查确认这个POST的20255/20256抛出点都在findSubmitReplay之后。

所以：
- 若同键同体已有可重放记录，先返回同一review，不会再进入20255/20256；若同键异体已有记录，先20143。
- 原样三字段POST返回20255/20256，足以证明**该事务检查回执时没有已落库的此键记录，而且这次失败尝试没有创建review**。正常同根锁提交若已经在其之前提交，恢复请求应读到回执并replay，不能把已提交请求误判成20255/20256。
- 这不是“该逻辑操作已被永久取消”的证明。20255/20256不写失败回执、不消耗键、不作废未来请求。尚未到达服务端、仍排队或其他标签页/自动队列将再次发送的原请求，以后仍可能尝试提交。尤其资格规则不进入simple hash：本次因规则返回20256，规则之后被正常移除，尚在途的原三字段请求可能随后通过。此为执行顺序和无失败回执推出的边界，本文未新增数据库实验。

| 恢复响应/证据 | 是否可解除“结果未知”状态 |
|---|---|
| 同activityId、同原始body的POST收到200/code0及review | 可以转为结果已知；保留键与reviewId关联用于审计/重试，不把它当新提交。状态以该review实际返回为准 |
| 三字段精确恢复收到20255/20256，且能确认该逻辑操作所有其他发送尝试均已结束、没有延迟发送/自动重试 | 可将此次意图标记为确定失败并结束未知恢复；20255走重新读取/确认，20256走专业流程；不应记录为“服务端取消令牌已生效” |
| 三字段精确恢复收到20255/20256，但原尝试或其他标签页请求仍未确定结束 | 只确定当前恢复尝试失败；保留原body和逻辑未知记录，停止产生新替代意图，仅读取或原样恢复。不要仅凭此码删除唯一恢复信息 |
| 401/403/404、400/40000、其他前置状态/资格错误、20143、5xx、网络超时 | 不能从该响应断言原提交未落库。授权/DTO可先于replay拒绝；20143说明请求与键不一致等冲突，不能当成“没有提交”。保留记录，恢复权限/核对原body后再处理 |
| 旧两字段请求收到20255/20256 | 本候选正常两字段路径不进入这两个新检查；核对实际发送body、端点和运行后端版本，不能据此清理旧未知记录 |

AbortController、页面关闭、超时或用户按“取消”都不等于服务端事务已取消，不能据此声称其他发送尝试已结束。只读GET也不是operationKey作废操作。若前端无法确认所有旧尝试结束，保守保留恢复记录；本后端没有提供永久终结未知operationKey的专门接口。

## 4. 错误合同

业务错误的JSON body恒为 `{code:number,message:string,data:null}`。这里没有新的hash、字段级配置清单、requiresProfessionalFlow布尔值或专业页面URL。不要按message文字分支；按HTTP和code判断。

| HTTP / code | 代码名与实际message | 前端处理与边界 |
|---|---|---|
| 409 / 20255 | ACTIVITY_SIMPLE_DRAFT_STALE；活动草稿已变化，请重新读取后再保存 | GET当前完整事实，重建预览并要求重新确认。文字沿保存错误码，提审也复用；不要误解为POST失败后必须盲目PUT。版本可能因review变化而变；不是权限码 |
| 409 / 20256 | ACTIVITY_SIMPLE_REVIEW_REQUIRES_PROFESSIONAL_FLOW；活动包含简单界面未展示的专业配置，请使用专业流程确认后提审 | 清晰引导现有专业界面，不自动删配置、不移除expectedDraftHash重试、不把刷新hash当成已解决 |
| 409 / 20143 | ACTIVITY_PUBLISH_REVIEW_OPERATION_KEY_CONFLICT；相同操作标识已用于不同的发布审核内容,请更换操作标识 | 检查是否把新hash/新活动塞进旧成功键；新意图用新键，结果未知则先恢复原请求 |
| 400 / 40000 | BAD_REQUEST；DTO错误message可包含拼接后的字段校验细节，服务防御message为请求参数错误 | 修正body；不是自动进入旧客户端模式的信号 |

错误优先级不是统一的“有变化必20255”：DTO/授权在前；新请求有任意活动/场次/岗位draft或active资格RuleSet时，20256可以先于hash不匹配；资格检查后才比hash，其他专业白名单在最终snapshot构建后检查。因此隐蔽专业编辑可先旧hash→20255，再刷新hash→20256。

成功响应data是Review DTO（id、activityId、requestVersion、baseRevision、status、snapshot等），**不返回新的draftHash**。不要把review.snapshot中的snapshotHash、requestVersion或baseRevision当draftHash。后续真实活动状态仍通过GET获取。

## 5. 可用于确认的读数与前端状态纪律

| 读数 | 是否可作为确认输入 |
|---|---|
| 对当前activityId成功GET simple-draft，code=0，合法draftHash，整份data已显示并由用户确认 | 可；GET在RepeatableRead事务中返回一致事实，但不是未来不变的保证，提交仍会锁内复核 |
| 成功PUT simple-draft的整份最终data，已替换本地预览并重新确认 | 可；与GET同一present/hash输出，不能沿用保存前hash |
| 同一GET轮询返回的完整data | 只能成为新的候选预览；若要用于新提交，须确认对应整份事实，不能静默升级已经确认/正在重试的body |
| 仅审核状态轮询、活动列表、普通详情、创建回执、审核POST响应 | 不可代替simple-draft确认；没有此合同的完整data+draftHash |
| 旧活动/旧请求晚到响应、保存前启动而保存后才返回的GET、未保存本地表单、拼接多个响应 | 不可直接作为最新确认；前端按activityId和请求世代丢弃过期响应，保存与确认串行化 |

建议前端分开保存：正在编辑的form、服务端draft候选、用户确认的不可变preview+hash、已经发出的不可变submitBody。确认后本地编辑、成功保存、切换活动、收到不同hash的完整新draft，都应使旧“新提交确认”失效并要求重新确认；已发送且结果未知的submitBody保留，用于原样恢复。相同hash也不证明隐藏配置已被用户看见。

editable仅是 `statusCode==='draft' && review?.status!=='pending' && template.statusCode==='active'` 的显示提示；不是授权凭据、不是已通过专业白名单、不是保证POST成功。新提交通常应只从合适草稿状态发起，但恢复同一提交结果应遵循上面的replay规则。200提交只代表审核记录；显示已发布必须依据后续服务端真实活动状态。

## 6. 20256、隐藏字段与旧客户端的实际边界

新保护仅针对携带expectedDraftHash的Admin简单提审新请求。GET/PUT未调用专业白名单；所以GET200、保存200或editable=true不能证明不会20256。既有assertSimple仍可对不支持的多场次/岗位、时段窗口或地点形态返回400等原有错误，不能把所有复杂配置错误统一映射成20256。

资格规则不属于simple hash的完整覆盖范围：活动/场次/岗位任何draft或active RuleSet都拒绝，retired历史不拦。其余隐藏配置按精确模板白名单比对：活动隐藏报名/可见性/保险/定位等、场次地点/阈值、岗位限制/负责人/职责装备、完整报名表、指标指针与时长/贡献selection。模板正常默认值（包括false、0、非空文本、模板自带governed表）保留；偏离则要求专业流程，不自动归零或删除。

有些隐藏字段变化会改变draftHash，有些资格变化不会；hash更新仅反映版本，不证明页面显示了这些字段。模板默认值获白名单允许，也不等于用户逐项读过。simple响应只包含政策安全摘要等有限展示；这是受限模板简单流程，不是完整proposal确认合同，前端不要宣传“审核快照全部内容均已确认”。

省略expectedDraftHash：保留旧版提交锁内最新草稿的行为、旧requestHash及replay，不启用本轮版本与专业白名单保护。App专业提审DTO保持原契约。新前端应始终带版本，不能用兼容缺省作为错误恢复策略。

## 7. 前端最小验证清单（建议在前端测试中落地，本文未执行前端测试）

1. GET/PUT都按真实envelope读取data.draftHash，definitionHash不同也不混用；成功保存后展示返回事实并使用新hash确认。
2. POST恰好顶层三字段，confirmation为boolean true；拒绝null/空/大写/非字符串hash。
3. 确认后另一次保存：收到409/20255，刷新整个预览、清除确认，不能自动代用户确认新内容。
4. 20256：即使GET200且editable=true，仍提示专业流程并保留所有已有配置，不能省略hash降级重试。
5. POST响应丢失后，轮询产生新hash/pending：重试仍发送原三字段；同成功键换hash应处理20143。
6. GET晚到、切换活动、保存期间轮询：旧响应不能替换确认候选；只轮询状态不得提升确认版本。
7. 撤权后的原样重放仍可403；不要把本地缓存的editable当授权。
8. 提审200不会显示“已发布”；退回后新提审要新意图/新键/新确认。
9. 从旧标签页加载两字段未知记录：不能补hash/null或换键；如不允许旧语义写恢复，保留并仅读取/核对。
10. 三字段未知恢复20255/20256：验证响应属于同id同body的POST；区别当前尝试失败与所有在途尝试已结束，不能以abort或timeout代替后者。
11. 撤权后403、未知请求20143、一般状态轮询都不能自动删除唯一恢复记录。
12. 已确认所有发送尝试终结时，原样恢复的20255/20256可结束未知状态，按失败类型转重新确认/专业流程，仍不宣称服务端永久取消了键。

已有后端证据（复用，当前交接未重跑数据库）：28项本文件真实数据库测试全过，含普通保存双连接竞态、三级资格、隐藏专业编辑/刷新后20256、重放与撤权；38项白名单矩阵包含正常模板默认值。完整source/test/scripts类型检查已通过。受保护生成物与新PR CI尚待正式处理；本文不声称候选已可在现有服务器使用。

## 8. 最小源码依据（逐字截取，候选行号）

下列相对路径是仓库内定位依据；代码已内嵌，跨线程无需访问本地路径。SHA-256是该路径整文件的摘要，用于核验同候选；片段不代表完整服务的全部前置规则。

### 路由与response DTO

`src/modules/activities/controllers/admin-simple-activities.controller.ts`，整文件SHA-256 `e05262d34cc62566f7804a25a839c7287ac2069303fbc46a601df983d3c063f8`。

L44–L46:

```ts

@ApiTags('Admin - Simple Activities')
@ApiBearerAuth()
```

L136–L145:

```ts
  @Get(':id/simple-draft')
  @LoginScoped({
    admission: 'app-member',
    require: 'all',
    engine: 'authz-scoped',
    scopes: ['responsibility'],
  })
  @ApiOperation({ summary: '本人简单活动最终事实、并发指纹和真实审核状态 [auth]' })
  @ApiWrappedOkResponse(AdminSimpleDraftResponseDto)
  @ApiBizErrorResponse(
```

L159–L174:

```ts
  get(@Param() params: IdParamDto, @CurrentUser() user: CurrentUserPayload) {
    return this.drafts.get(params.id, user);
  }

  @Put(':id/simple-draft')
  @RequiresPermission('activity.update.record', {
    admission: 'app-member',
    require: 'all',
    engine: 'authz-scoped',
    scopes: ['responsibility'],
  })
  @ApiOperation({ summary: '根锁和指纹保护的一次完整草稿保存 [rbac: activity.update.record]' })
  @ApiWrappedOkResponse(AdminSimpleDraftResponseDto)
  @ApiBizErrorResponse(
    BizCode.BAD_REQUEST,
    BizCode.UNAUTHORIZED,
```

L201–L211:

```ts
  @Post(':id/publish-reviews')
  @HttpCode(HttpStatus.OK)
  @LoginScoped({
    admission: 'app-member',
    require: 'all',
    engine: 'authz-scoped',
    scopes: ['responsibility'],
  })
  @ApiOperation({ summary: '本人用客户端幂等键提交现行发布审核，成功不代表已发布 [auth]' })
  @ApiWrappedOkResponse(ActivityPublishReviewResponseDto)
  @ApiBizErrorResponse(
```

L227–L234:

```ts
  submit(
    @Param() params: IdParamDto,
    @Body() input: AdminSubmitSimpleActivityReviewDto,
    @CurrentUser() user: CurrentUserPayload,
    @Req() req: Request,
  ) {
    return this.drafts.submitReview(params.id, input, user, this.meta(req));
  }
```

### GET/PUT响应数据位置

`src/modules/activities/dto/admin/admin-simple-activity-response.dto.ts`，整文件SHA-256 `51100fc526e885ae47240bd41333ef27f5629a3f74853eed47a81fb535d71595`。

L125–L164:

```ts
export class AdminSimpleDraftResponseDto {
  @ApiProperty({ description: '活动 ID' }) activityId!: string;
  @ApiProperty({ description: '服务端活动标题' }) title!: string;
  @ApiProperty({ description: '承办组织 ID' }) organizationId!: string;
  @ApiProperty({ description: '原活动类型' }) activityTypeCode!: string;
  @ApiProperty({ description: '首版固定先到先得', enum: ['first_come'] })
  allocationModeCode!: string;
  @ApiProperty({ description: '活动开始', format: 'date-time' }) startAt!: string;
  @ApiProperty({ description: '活动结束', format: 'date-time' }) endAt!: string;
  @ApiProperty({ description: '最终主地点文字' }) location!: string;
  @ApiProperty({ description: '最终实例事实', type: () => AdminSimpleActivityInstanceDto })
  instance!: AdminSimpleActivityInstanceDto;
  @ApiProperty({ description: '实际活动状态' }) statusCode!: string;
  @ApiProperty({
    description: '最新审核；null 尚无审核',
    type: () => AdminSimpleDraftReviewDto,
    nullable: true,
  })
  review!: AdminSimpleDraftReviewDto | null;
  @ApiProperty({ description: '仅当前草稿无待审且模板仍可选时为 true，操作仍重新鉴权' })
  editable!: boolean;
  @ApiProperty({ description: '本次读取的完整并发指纹', pattern: '^[0-9a-f]{64}$' })
  draftHash!: string;
  @ApiProperty({ description: '原精确模板版本 ID' }) selectedTemplateVersionId!: string;
  @ApiProperty({ description: '原精确模板定义摘要', pattern: '^[0-9a-f]{64}$' })
  definitionHash!: string;
  @ApiProperty({ description: '唯一场次最终事实', type: () => AdminSimpleDraftSessionDto })
  session!: AdminSimpleDraftSessionDto;
  @ApiProperty({ description: '唯一默认岗位最终事实', type: () => AdminSimpleDraftPositionDto })
  position!: AdminSimpleDraftPositionDto;
  @ApiProperty({
    description: '同样应用于活动和唯一场次的完整本地地点；读取以 inline 返回',
    type: () => [AdminSimpleActivityPlaceDto],
  })
  places!: AdminSimpleActivityPlaceDto[];
  @ApiProperty({
    description: '原时长/贡献政策的有权安全摘要，不是政策写入口',
    type: () => [AdminSimpleDraftPolicyDto],
  })
  policies!: AdminSimpleDraftPolicyDto[];
```

### 保存和提审DTO

`src/modules/activities/dto/admin/admin-simple-activity.dto.ts`，整文件SHA-256 `1f6ab1972605997a12cf41460508a0cc2b67d1237a61a9fe9004d77ddafae7ee`。

L154–L161:

```ts
export class AdminSaveSimpleActivityDto extends AdminSimpleActivityFactsDto {
  @ApiProperty({
    description: '最近一次读取所得完整草稿并发指纹，不是授权凭据',
    pattern: '^[0-9a-f]{64}$',
  })
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  expectedDraftHash!: string;
```

L193–L213:

```ts
export class AdminSubmitSimpleActivityReviewDto {
  @ApiProperty({ description: '提交审核幂等键', minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  operationKey!: string;
  @ApiProperty({ description: '确认读取最终草稿并提交审核，只能为 true', example: true })
  @IsBoolean()
  @Equals(true)
  confirmation!: boolean;

  @ApiPropertyOptional({
    description:
      '确认时 GET simple-draft 返回的 draftHash；提供时拒绝已变更的简单草稿。省略保留旧版提交最新草稿语义。仅接受现行简单模板配置白名单；资格规则或模板外专业配置须使用专业流程。保留模板默认值不代表用户已逐项阅读，非完整 proposal 确认令牌。',
    pattern: '^[0-9a-f]{64}$',
  })
  @OmittableOnly()
  @IsString()
  @Matches(/^[0-9a-f]{64}$/)
  expectedDraftHash?: string;
}
```

### 省略与null语义

`src/common/decorators/omittable-only.decorator.ts`，整文件SHA-256 `4cd9889d50a08e27a75d1b5bb1e3110fede55ae08556aa0ff7631fdc3f4fdad5`。

L31–L35:

```ts
// 实现说明:`ValidateIf` 的回调返回 false 时,class-validator 会跳过该属性的
// **全部**校验器,所以 `undefined` 照常放行;值为 `null` 时回调返回 true,
// `null` 会落到后面的 `@IsString()` / `@IsEnum()` 之类上,由它们拒成 400。
export const OmittableOnly = (): PropertyDecorator =>
  ValidateIf((_o, value) => value !== undefined);
```

### 全局前缀和严格请求校验

`src/bootstrap/apply-global-setup.ts`，整文件SHA-256 `c1fe3102b61c41e9f22392ad395638a87c0b62d8cc90a4633146253da18c1bca`。

L214–L226:

```ts
  app.setGlobalPrefix('/api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // production-like(production / smoke)隐藏异常 message;sanitize 沿 production 行为
  app.useGlobalFilters(new AllExceptionsFilter(isProductionLike(appCfg.env)));
  app.useGlobalInterceptors(new ResponseInterceptor());
```

### GET与保存最终响应、hash/present

`src/modules/activities/activity-simple-draft.service.ts`，整文件SHA-256 `adfd294457b703c3fe1109487d65f4313c7d72503c43180ba8a3c9816023e26f`。

L190–L199:

```ts
  get(activityId: string, user: CurrentUserPayload) {
    return this.prisma.$transaction(
      async (tx) => {
        const { activity } = await this.authorize(tx, activityId, user, false);
        const bundle = await this.readBundle(tx, activity);
        this.assertSimple(bundle);
        return this.present(bundle);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
```

L342–L345:

```ts
      const after = await this.readBundle(tx, current.activity);
      this.assertSimple(after);
      return this.present(after);
    });
```

L573–L595:

```ts
  private hash(bundle: Awaited<ReturnType<ActivitySimpleDraftService['readBundle']>>) {
    const { activity, template, sessions, positions, places, forms, review, time, contribution } =
      bundle;
    return simpleDraftHash(
      JSON.parse(
        JSON.stringify({
          activity,
          template: {
            id: template.id,
            definitionHash: template.definitionHash,
            statusCode: template.statusCode,
            family: template.family,
          },
          sessions,
          positions,
          places,
          forms,
          review,
          time: time?.selectionHash ?? null,
          contribution: contribution?.selectionHash ?? null,
        }),
      ) as CanonicalValue,
    );
```

L621–L644:

```ts
    return {
      activityId: row.id,
      title: row.title,
      organizationId: row.organizationId,
      activityTypeCode: row.activityTypeCode,
      allocationModeCode: row.allocationModeCode,
      startAt: row.startAt.toISOString(),
      endAt: row.endAt.toISOString(),
      location: row.location,
      instance: {
        capacity: row.capacity,
        registrationDeadline: row.registrationDeadline?.toISOString() ?? null,
        description: row.description,
        registrationNotes: row.registrationNotes,
      },
      statusCode: row.statusCode,
      review,
      editable:
        row.statusCode === 'draft' &&
        review?.status !== 'pending' &&
        template.statusCode === 'active',
      draftHash: this.hash(bundle),
      selectedTemplateVersionId: template.id,
      definitionHash: template.definitionHash!,
```

### 新请求资格、版本和最终白名单入口

`src/modules/activities/activity-simple-draft.service.ts`，整文件SHA-256 `adfd294457b703c3fe1109487d65f4313c7d72503c43180ba8a3c9816023e26f`。

L115–L160:

```ts
  submitReview(
    activityId: string,
    input: AdminSubmitSimpleActivityReviewDto,
    user: CurrentUserPayload,
    meta: AuditMeta,
  ) {
    if (
      input.expectedDraftHash !== undefined &&
      (typeof input.expectedDraftHash !== 'string' ||
        !/^[0-9a-f]{64}$/u.test(input.expectedDraftHash))
    )
      throw new BizException(BizCode.BAD_REQUEST);
    return this.reviewSubmit.submitInitialProposal(
      activityId,
      { operationKey: input.operationKey, confirmation: input.confirmation },
      user,
      meta,
      async (tx) => {
        await this.authorize(tx, activityId, user, false);
      },
      input.expectedDraftHash === undefined
        ? undefined
        : {
            expectedDraftHash: input.expectedDraftHash,
            assertCurrent: async (tx) => {
              const { activity } = await this.authorize(tx, activityId, user, false);
              // Called after exact replay under the Activity lock, also held by rule writers.
              // The simple screen/hash omits all three scopes of qualification rules.
              const qualification = await tx.activityQualificationRuleSet.findFirst({
                where: { activityId, statusCode: { in: ['draft', 'active'] } },
                select: { id: true },
              });
              if (qualification)
                throw new BizException(BizCode.ACTIVITY_SIMPLE_REVIEW_REQUIRES_PROFESSIONAL_FLOW);
              const bundle = await this.readBundle(tx, activity);
              this.assertSimple(bundle);
              if (this.hash(bundle) !== input.expectedDraftHash)
                throw new BizException(BizCode.ACTIVITY_SIMPLE_DRAFT_STALE);
              const template = parseStoredTemplateVersion(bundle.template);
              return (proposal) => {
                if (!matchesSimpleReviewProfile(proposal, template))
                  throw new BizException(BizCode.ACTIVITY_SIMPLE_REVIEW_REQUIRES_PROFESSIONAL_FLOW);
              };
            },
          },
    );
```

### 锁、授权、重放、最终snapshot检查

`src/modules/activities/activity-publish-review-submit.service.ts`，整文件SHA-256 `35630339493f0e4ac08605c760a1ec158c3cf7eb16e2e910ec44a7dfb10b8e01`。

L478–L486:

```ts
    // 幂等哈希:不按组织定向时 payload 逐字节沿用本刀之前的形状 —— 否则同一 operationKey 的
    // 存量 pending 提交会算出新哈希,replay 对不上,当场变成「幂等键冲突」而不是幂等命中。
    const requestHash =
      audienceTagCodes === null
        ? this.submitRequestHash(
            'initial',
            activityId,
            confirmation ? { ...dto, expectedDraftHash: confirmation.expectedDraftHash } : dto,
          )
```

L497–L515:

```ts
      const row = await this.prisma.$transaction(async (tx) => {
        await lockActivity(activityId, tx);
        await revalidateAdapter?.(tx);
        const activity = await tx.activity.findUniqueOrThrow({
          where: { id: activityId },
          select: {
            statusCode: true,
            workflowRevision: true,
            allocationModeCode: true,
            initiatorMemberId: true,
            startAt: true,
            endAt: true,
            registrationDeadline: true,
            isPublicRegistration: true,
          },
        });
        if (!user.memberId || activity.initiatorMemberId !== user.memberId) {
          throw new BizException(BizCode.ACTIVITY_NOT_FOUND);
        }
```

L522–L566:

```ts
        await this.allocationModes.assertLockedActivityConsistent(tx, {
          id: activityId,
          allocationModeCode: activity.allocationModeCode,
        });
        const replay = await this.findSubmitReplay(tx, dto.operationKey, requestHash);
        if (replay) return replay;
        // The successful submission itself changes simple-draft's review component.
        // Only new submissions compare the confirmed version, while still holding Activity.
        const assertConfirmedProposal = await confirmation?.assertCurrent(tx);
        ensureInitialPublishable(activity);
        if (audienceTagCodes !== null) {
          if (!activity.isPublicRegistration) throw new BizException(BizCode.BAD_REQUEST);
          await resolveActiveAudienceTagIds(tx, audienceTagCodes);
          await assertActiveOrganizationIds(tx, audienceOrganizationIds);
        }
        const pending = await tx.activityPublishReview.count({
          where: { activityId, status: 'pending' },
        });
        if (pending > 0) throw new BizException(BizCode.ACTIVITY_PUBLISH_REVIEW_PENDING);
        const decision = this.stateMachine.decide('submit');
        if (!decision.allowed) throw new BizException(decision.biz);
        let actor = user;
        const snapshot = await this.proposalV2.buildInitial(tx, activityId, async () => {
          await revalidateAdapter?.(tx);
          actor = await this.revalidateInitialProposalSubmission(
            tx,
            activityId,
            user,
            audienceTagCodes,
            audienceOrganizationIds,
          );
        });
        // Inspect the exact snapshot after the builder's reference locks, before any review write.
        if (assertConfirmedProposal) assertConfirmedProposal(snapshot);
        const review = await tx.activityPublishReview.create({
          data: {
            activityId,
            requestType: 'initial',
            requestVersion: await this.nextRequestVersion(activityId, tx),
            baseRevision: activity.workflowRevision,
            status: decision.nextStatus,
            snapshot: JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue,
            submittedByUserId: user.id,
            operationKey: dto.operationKey,
            requestHash,
```

L714–L727:

```ts
  private async findSubmitReplay(
    tx: PrismaTx,
    operationKey: string,
    requestHash: string,
  ): Promise<ActivityPublishReviewViewRow | null> {
    const existing = await tx.activityPublishReview.findUnique({
      where: { operationKey },
      select: activityPublishReviewIdempotencySelect,
    });
    if (!existing) return null;
    if (existing.requestHash !== requestHash) {
      throw new BizException(BizCode.ACTIVITY_PUBLISH_REVIEW_OPERATION_KEY_CONFLICT);
    }
    return existing;
```

L738–L753:

```ts
  private async rethrowSubmitOperationKeyConflict(
    error: unknown,
    operationKey: string,
    requestHash: string,
  ): Promise<ActivityPublishReviewResponseDto> {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
    const existing = await this.prisma.activityPublishReview.findUnique({
      where: { operationKey },
      select: activityPublishReviewIdempotencySelect,
    });
    if (existing && existing.requestHash === requestHash) {
      return this.presenter.toDto(existing);
    }
    throw new BizException(BizCode.ACTIVITY_PUBLISH_REVIEW_OPERATION_KEY_CONFLICT);
```

L756–L766:

```ts
  private submitRequestHash(
    action: 'initial' | 'change',
    activityId: string,
    dto: (SubmitActivityPublishReviewDto & { expectedDraftHash?: string }) | ChangeReviewDto,
  ): string {
    return hashCanonical({
      action: `publish-review-submit:${action}`,
      activityId,
      payload: dto,
    });
  }
```

### 白名单边界及模板表单/政策比较

`src/modules/activities/activity-simple-review-profile.ts`，整文件SHA-256 `310aa112e310d47bf0193a588a4a04bfc2913d26e117fd522b0930e96f36d304`。

L32–L48:

```ts
/**
 * A closed profile, not evidence that the user saw the template's hidden defaults.
 * Visible instance values below are retained; hidden values must match the exact selected
 * template / existing materializer defaults. Complete typed objects make new proposal fields
 * require an explicit decision here. Shape, current authorization and reference validity remain
 * the caller/builder's responsibility. This only inspects the final proposal; it never repairs it.
 */
export function matchesSimpleReviewProfile(
  facts: SimpleReviewFacts,
  template: SimpleReviewTemplate,
): boolean {
  if (
    facts.sessions.length !== 1 ||
    template.sessions.length !== 1 ||
    facts.qualificationRuleSets.ruleSets.length !== 0
  )
    return false;
```

L134–L164:

```ts
  if (!same(facts.registrationForm?.definition ?? null, template.registrationForm ?? null))
    return false;
  const metric = template.metricSelection ?? {
    metricRequirementCode: 'not_required',
    metricSetPointer: null,
  };
  if (
    !same(
      {
        metricRequirementCode: facts.metricRequirementCode,
        metricSetPointer: facts.metricSetPointer,
      },
      metric,
    )
  )
    return false;
  const targets = [
    { id: s.sessionId, code: s.code, positions: [{ id: p.positionId, code: p.code }] },
  ];
  const time = template.timePolicySelection
    ? materializeActivityTemplateTimePolicySelection(template.timePolicySelection, targets)
    : null;
  if (!same(facts.timePolicyPointers?.selection ?? null, time)) return false;
  const contribution = template.contributionPolicySelection
    ? materializeActivityTemplateContributionPolicySelection(
        template.contributionPolicySelection,
        targets,
      ).document
    : null;
  return same(facts.contributionPolicyPointers?.selection ?? null, contribution);
}
```

### 不应在浏览器重算的服务端hash

`src/modules/activities/activity-simple-draft-plan.ts`，整文件SHA-256 `3ce9bb5e68e860a9f118760c82ffe8384fecdc4f2fd244a59b6f1e0059ec1384`。

L138–L140:

```ts
export function simpleDraftHash(facts: CanonicalValue): string {
  return createHash('sha256').update(canonicalize(facts)).digest('hex');
}
```

### 规范化请求hash

`src/modules/activities/activity-publish-review-idempotency.ts`，整文件SHA-256 `af81b20bd47a574431d0131a25d356e8b18e995fb2cd179389ece4588b8487f6`。

L19–L35:

```ts
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function hashCanonical(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex');
}
```

### 错误码

`src/common/exceptions/biz-code.constant.ts`，整文件SHA-256 `0c9ad0f94e3afbad71f0bf77f33e8226334e5fb7512a27a323ff2b0992ce6990`。

L62–L62:

```ts
  BAD_REQUEST: { code: 40000, message: '请求参数错误', httpStatus: HttpStatus.BAD_REQUEST },
```

L1697–L1701:

```ts
  ACTIVITY_PUBLISH_REVIEW_OPERATION_KEY_CONFLICT: {
    code: 20143,
    message: '相同操作标识已用于不同的发布审核内容,请更换操作标识',
    httpStatus: HttpStatus.CONFLICT,
  },
```

L1815–L1824:

```ts
  ACTIVITY_SIMPLE_DRAFT_STALE: {
    code: 20255,
    message: '活动草稿已变化，请重新读取后再保存',
    httpStatus: HttpStatus.CONFLICT,
  },
  ACTIVITY_SIMPLE_REVIEW_REQUIRES_PROFESSIONAL_FLOW: {
    code: 20256,
    message: '活动包含简单界面未展示的专业配置，请使用专业流程确认后提审',
    httpStatus: HttpStatus.CONFLICT,
  },
```

### 业务错误响应envelope

`src/common/filters/all-exceptions.filter.ts`，整文件SHA-256 `f18cc49b00a2827b7954939c0f8419f3465d8ace75bc46d4415262e5ef57b118`。

L30–L49:

```ts
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof BizException) {
      response.status(exception.biz.httpStatus).json({
        code: exception.biz.code,
        message: exception.biz.message,
        data: null,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const biz = HTTP_STATUS_TO_BIZ[status] ?? BizCode.INTERNAL_ERROR;
      response.status(status).json({
        code: biz.code,
        message: this.resolveHttpExceptionMessage(exception, status, biz.message),
        data: null,
      });
```

L69–L85:

```ts
  // 仅 BadRequest(400)且来自 ValidationPipe(message 是 string[])时透传字段校验细节;
  // 401 / 403 / 404 / 其他 HttpException 一律使用 BizCode 通用 message,
  // 避免暴露 NestJS 默认 message(如 "Cannot GET /api/xxx" 这类路径信息)。
  private resolveHttpExceptionMessage(
    exception: HttpException,
    status: number,
    fallback: string,
  ): string {
    const httpBadRequest: number = HttpStatus.BAD_REQUEST;
    if (status !== httpBadRequest) return fallback;

    const res = exception.getResponse();
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const m: unknown = res.message;
      if (Array.isArray(m) && m.length > 0) {
        return m.map((item) => String(item)).join('; ');
      }
```

### 成功响应envelope

`src/common/interceptors/response.interceptor.ts`，整文件SHA-256 `dfa19f83a1ec85eb31c633b74756148bde674933e384479fc5777a5e9689d083`。

L18–L22:

```ts
interface WrappedResponse<T> {
  code: 0;
  message: 'ok';
  data: T;
}
```

L32–L37:

```ts
    return next.handle().pipe(
      map((data: unknown): unknown => {
        if (data instanceof StreamableFile) return data;
        const wrapped: WrappedResponse<unknown> = { code: 0, message: 'ok', data };
        return wrapped;
      }),
```

### 前端生成客户端的实际返回类型

`docs/handoff/clients/admin/client.ts`，整文件SHA-256 `f40a502c5a348d720225ea45fd38d41b0a15f4e01b4ec9473e0838eccebbe4b4`。

L641–L655:

```ts
    /** 本人用客户端幂等键提交现行发布审核，成功不代表已发布 [auth] */
    AdminSimpleActivitiesControllerSubmit(id: string, body: AdminSubmitSimpleActivityReviewDto): Promise<ApiEnvelope<ActivityPublishReviewResponseDto>> {
      return fetcher<ActivityPublishReviewResponseDto>({ method: "POST", path: `/api/admin/v1/activities/${id}/publish-reviews`, body });
    },
    /** 按会员受众标签发布活动(空数组面向全部有效会员；开关关闭时 503) [rbac: activity.publish.record] */
    ActivitiesControllerPublishWithAudienceTags(id: string, body: PublishActivityWithAudienceTagsDto): Promise<ApiEnvelope<ActivityResponseDto>> {
      return fetcher<ActivityResponseDto>({ method: "PATCH", path: `/api/admin/v1/activities/${id}/publish-with-audience-tags`, body });
    },
    /** 本人简单活动最终事实、并发指纹和真实审核状态 [auth] */
    AdminSimpleActivitiesControllerGet(id: string): Promise<ApiEnvelope<AdminSimpleDraftResponseDto>> {
      return fetcher<AdminSimpleDraftResponseDto>({ method: "GET", path: `/api/admin/v1/activities/${id}/simple-draft` });
    },
    /** 根锁和指纹保护的一次完整草稿保存 [rbac: activity.update.record] */
    AdminSimpleActivitiesControllerSave(id: string, body: AdminSaveSimpleActivityDto): Promise<ApiEnvelope<AdminSimpleDraftResponseDto>> {
      return fetcher<AdminSimpleDraftResponseDto>({ method: "PUT", path: `/api/admin/v1/activities/${id}/simple-draft`, body });
```

### replay与换hash冲突的已通过后端断言

`test/e2e/activity-os-v1-simple-draft.e2e-spec.ts`，整文件SHA-256 `96a5a88edd5f57988649ba91088d55059fe9c7997c2ad2ec5880d55e3d545e8c`。

L777–L809:

```ts
  it('confirmation: replays the full versioned request before checking the changed review hash and rejects key reuse', async () => {
    const { id, draft, read } = await confirmationDraft();
    const body = {
      operationKey: key('confirm_once'),
      confirmation: true,
      expectedDraftHash: draft.draftHash,
    };
    const post = (payload: object, auth = publisher.auth) =>
      request(httpServer(app))
        .post(`${ROOT}/${id}/publish-reviews`)
        .set('Authorization', auth)
        .send(payload);
    const first = await post(body).expect(200);
    const after = (await read()).body.data;
    expect(after.draftHash).not.toBe(draft.draftHash);
    const effects = await db.auditLog.count({ where: { resourceId: id } });
    expect((await post(body).expect(200)).body.data).toEqual(first.body.data);
    expect(await db.auditLog.count({ where: { resourceId: id } })).toBe(effects);
    expect(await db.activityPublishReview.count({ where: { activityId: id } })).toBe(1);
    expectBizError(
      await post({ ...body, expectedDraftHash: after.draftHash }),
      BizCode.ACTIVITY_PUBLISH_REVIEW_OPERATION_KEY_CONFLICT,
    );
    expectBizError(
      await post({ operationKey: body.operationKey, confirmation: true }),
      BizCode.ACTIVITY_PUBLISH_REVIEW_OPERATION_KEY_CONFLICT,
    );
    expectBizError(await post(body, outsider.auth), BizCode.ACTIVITY_NOT_FOUND);
    expectBizError(
      await post({ ...body, operationKey: key('confirm_stale_new') }),
      BizCode.ACTIVITY_SIMPLE_DRAFT_STALE,
    );
  });
```

L917–L940:

```ts
      const refreshed = (await read()).body.data;
      expect(refreshed.title).toBe('确认后另一次保存');
      await request(httpServer(app))
        .post(`${ROOT}/${id}/publish-reviews`)
        .set('Authorization', publisher.auth)
        .send({ ...body, expectedDraftHash: refreshed.draftHash })
        .expect(200);
    },
  );

  it.each([null, '', 'invalid', 'A'.repeat(64), 1])(
    'confirmation: rejects malformed version %p',
    async (expectedDraftHash) => {
      const { id } = await confirmationDraft();
      expectBizError(
        await request(httpServer(app))
          .post(`${ROOT}/${id}/publish-reviews`)
          .set('Authorization', publisher.auth)
          .send({ operationKey: key('confirm_bad'), confirmation: true, expectedDraftHash }),
        BizCode.BAD_REQUEST,
        { strictMessage: false },
      );
      expect(await db.activityPublishReview.count({ where: { activityId: id } })).toBe(0);
    },
```

L1670–L1686:

```ts
    await save;
    expectBizError(await submit, BizCode.ACTIVITY_SIMPLE_DRAFT_STALE);
    const current = (await read()).body.data;
    expect({ ...current, draftHash: null }).toEqual({ ...draft, draftHash: null });
    expect(current.draftHash).not.toBe(draft.draftHash);
    expectBizError(
      await request(httpServer(app))
        .post(`${ROOT}/${id}/publish-reviews`)
        .set('Authorization', publisher.auth)
        .send({
          operationKey: key('whitelist_race_retry'),
          confirmation: true,
          expectedDraftHash: current.draftHash,
        }),
      BizCode.ACTIVITY_SIMPLE_REVIEW_REQUIRES_PROFESSIONAL_FLOW,
    );
    expect(await db.activityPublishReview.count({ where: { activityId: id } })).toBe(0);
```

本次未做：未修改源码、受保护文件或候选补丁，未发令牌、推送、建PR、部署、重跑数据库或主动联系其他线程。仅创建此交接文件供Library跨线程读取。
