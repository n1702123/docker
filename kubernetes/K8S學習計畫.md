# Kubernetes (K8S) 學習計畫

## 📚 學習路線圖

### 第一階段：基礎入門（2-3週）

#### 學習目標
- 理解容器化技術與 Kubernetes 的關係
- 掌握 K8S 核心概念和架構
- 能夠搭建本地開發環境

#### 核心概念
1. **容器基礎**
   - Docker 容器基本操作
   - 容器映像檔（Image）與容器（Container）
   - Dockerfile 編寫

2. **Kubernetes 架構**
   - Master 節點組件：API Server、Scheduler、Controller Manager、etcd
   - Worker 節點組件：Kubelet、Kube-proxy、Container Runtime
   - K8S 集群架構圖解

3. **核心資源對象**
   - Pod：K8S 最小部署單元
   - Namespace：資源隔離
   - Label 與 Selector：資源標記與選擇

#### 實作練習
- [ ] 安裝 Docker Desktop 或 Minikube
- [ ] 使用 kubectl 連接本地集群
- [ ] 創建第一個 Pod
- [ ] 查看 Pod 日誌和狀態
- [ ] 使用 kubectl describe、logs、exec 命令

#### 檢核點
- ✓ 能解釋 K8S 解決了什麼問題
- ✓ 能畫出 K8S 基本架構圖
- ✓ 熟悉 kubectl 基本命令（create、get、describe、delete）

---

### 第二階段：應用部署（3-4週）

#### 學習目標
- 掌握應用部署的多種方式
- 理解服務發現與負載均衡
- 學會配置管理和密鑰管理

#### 核心概念
1. **工作負載控制器**
   - Deployment：無狀態應用部署
   - ReplicaSet：副本管理
   - DaemonSet：每個節點運行一個 Pod
   - Job 與 CronJob：批處理任務

2. **服務發現與網絡**
   - Service：ClusterIP、NodePort、LoadBalancer
   - Endpoint：服務端點
   - DNS 服務發現機制

3. **配置與密鑰**
   - ConfigMap：配置管理
   - Secret：敏感信息管理
   - 環境變數注入
   - Volume 掛載配置

#### 實作練習
- [ ] 部署一個 Nginx Deployment（3個副本）
- [ ] 創建 Service 暴露應用
- [ ] 使用 ConfigMap 配置應用
- [ ] 使用 Secret 管理密碼
- [ ] 實現滾動更新和回滾
- [ ] 配置健康檢查（Liveness & Readiness Probe）

#### 檢核點
- ✓ 能夠編寫完整的 Deployment YAML
- ✓ 理解不同 Service 類型的使用場景
- ✓ 會使用 ConfigMap 和 Secret

---

### 第三階段：進階特性（4-5週）

#### 學習目標
- 掌握有狀態應用部署
- 理解持久化存儲機制
- 學會資源管理和調度

#### 核心概念
1. **有狀態應用**
   - StatefulSet：有狀態應用管理
   - Headless Service
   - 穩定的網絡標識和存儲

2. **存儲管理**
   - Volume 類型：emptyDir、hostPath、nfs
   - PersistentVolume (PV)
   - PersistentVolumeClaim (PVC)
   - StorageClass：動態存儲供應

3. **資源管理**
   - Resource Requests 與 Limits
   - QoS 類別：Guaranteed、Burstable、BestEffort
   - LimitRange 和 ResourceQuota
   - HPA（Horizontal Pod Autoscaler）

4. **調度與親和性**
   - NodeSelector：節點選擇
   - Node Affinity：節點親和性
   - Pod Affinity/Anti-Affinity
   - Taints 與 Tolerations

#### 實作練習
- [ ] 部署 MySQL StatefulSet
- [ ] 配置 PV 和 PVC
- [ ] 設置資源請求和限制
- [ ] 配置 HPA 自動擴縮容
- [ ] 使用親和性規則調度 Pod

#### 檢核點
- ✓ 理解有狀態與無狀態應用的區別
- ✓ 能夠配置持久化存儲
- ✓ 會設置資源配額和自動擴縮容

---

### 第四階段：網絡與安全（3-4週）

#### 學習目標
- 深入理解 K8S 網絡模型
- 掌握 Ingress 流量管理
- 學會安全最佳實踐

#### 核心概念
1. **網絡深入**
   - CNI（Container Network Interface）
   - Pod 網絡通信原理
   - Service 網絡實現：iptables vs IPVS
   - NetworkPolicy：網絡策略

2. **Ingress 控制器**
   - Ingress 資源對象
   - Nginx Ingress Controller
   - 路徑路由和虛擬主機
   - TLS/SSL 配置

3. **安全機制**
   - RBAC：角色訪問控制
   - ServiceAccount
   - SecurityContext：容器安全上下文
   - Pod Security Standards
   - Network Policy：網絡隔離

#### 實作練習
- [ ] 安裝 Nginx Ingress Controller
- [ ] 配置 Ingress 路由規則
- [ ] 配置 HTTPS 證書
- [ ] 創建 Role 和 RoleBinding
- [ ] 配置 NetworkPolicy 隔離應用

#### 檢核點
- ✓ 理解 K8S 網絡三層模型
- ✓ 能夠配置 Ingress 暴露服務
- ✓ 掌握 RBAC 權限管理

---

### 第五階段：監控與運維（3-4週）

#### 學習目標
- 掌握集群監控方案
- 學會日誌收集與分析
- 理解故障排查方法

#### 核心概念
1. **監控體系**
   - Metrics Server：資源指標
   - Prometheus + Grafana：監控告警
   - 關鍵指標：CPU、Memory、Network、Disk

2. **日誌管理**
   - 容器日誌收集
   - EFK/ELK Stack（Elasticsearch、Fluentd/Logstash、Kibana）
   - 集中式日誌管理

3. **故障排查**
   - Pod 狀態診斷（Pending、CrashLoopBackOff、ImagePullBackOff）
   - 節點故障排查
   - 網絡問題診斷
   - 常用排查命令和工具

#### 實作練習
- [ ] 部署 Metrics Server
- [ ] 安裝 Prometheus 和 Grafana
- [ ] 配置告警規則
- [ ] 部署日誌收集組件
- [ ] 模擬故障並排查

#### 檢核點
- ✓ 能夠搭建基本監控系統
- ✓ 會查看和分析日誌
- ✓ 掌握常見問題排查方法

---

### 第六階段：實戰與進階（持續學習）

#### 學習目標
- 掌握 CI/CD 集成
- 理解 GitOps 理念
- 學習生產環境最佳實踐

#### 核心概念
1. **CI/CD 集成**
   - Jenkins/GitLab CI 與 K8S 集成
   - ArgoCD/Flux：GitOps 工具
   - Helm：應用包管理
   - Kustomize：配置管理

2. **多集群管理**
   - 聯邦集群（Federation）
   - 多集群部署策略
   - 集群災難恢復

3. **進階主題**
   - Operator 模式
   - Custom Resource Definition (CRD)
   - Service Mesh（Istio/Linkerd）
   - Serverless（Knative）

4. **生產最佳實踐**
   - 高可用性架構
   - 備份與恢復策略
   - 升級策略
   - 成本優化

#### 實作練習
- [ ] 使用 Helm 部署應用
- [ ] 配置 CI/CD 流水線
- [ ] 部署 ArgoCD 實現 GitOps
- [ ] 創建簡單的 CRD
- [ ] 設計高可用架構方案

#### 檢核點
- ✓ 能夠使用 Helm 管理應用
- ✓ 理解 GitOps 工作流
- ✓ 掌握生產環境部署要點

---

## 🛠️ 推薦工具

### 本地開發環境
- **Minikube**：本地單節點集群
- **Kind**：Docker 中運行 K8S
- **Docker Desktop**：內置 K8S 支持
- **K3s/K3d**：輕量級 K8S

### 命令行工具
- **kubectl**：K8S 命令行工具
- **kubectx/kubens**：快速切換 context 和 namespace
- **k9s**：終端 UI 管理工具
- **stern**：多 Pod 日誌查看
- **helm**：包管理工具

### 可視化工具
- **Kubernetes Dashboard**：官方 Web UI
- **Lens**：K8S IDE
- **Octant**：Web 界面工具

---

## 📖 學習建議

### 學習方法
1. **理論與實踐結合**：每學一個概念立即動手實踐
2. **循序漸進**：不要跳過基礎直接學高級主題
3. **多做實驗**：搭建測試環境，大膽嘗試
4. **閱讀官方文檔**：養成查閱官方文檔的習慣
5. **參與社群**：加入 K8S 社群討論交流

### 時間分配建議
- 每週學習時間：10-15 小時
- 理論學習：40%
- 動手實踐：50%
- 複習總結：10%

### 認證考試（可選）
- **CKA**（Certified Kubernetes Administrator）：管理員認證
- **CKAD**（Certified Kubernetes Application Developer）：開發者認證
- **CKS**（Certified Kubernetes Security Specialist）：安全專家認證

---

## 📝 學習記錄

### 進度追蹤
- [ ] 第一階段：基礎入門
- [ ] 第二階段：應用部署
- [ ] 第三階段：進階特性
- [ ] 第四階段：網絡與安全
- [ ] 第五階段：監控與運維
- [ ] 第六階段：實戰與進階

### 筆記與心得
建議創建個人學習筆記，記錄：
- 重要概念理解
- 實踐中遇到的問題和解決方案
- 最佳實踐總結
- 常用命令備忘

---

**祝學習順利！堅持下去，你一定能掌握 Kubernetes！** 🚀
