# Colima 启动报错: `failed to run attach disk "colima", in use by instance "colima"`

## 问题

启动 `colima` 时，出现如下错误：

```text
{"level":"fatal","msg":"failed to run attach disk \"colima\", in use by instance \"colima\"","time":"2026-03-28T15:15:19+08:00"}
```

表现为：

- `colima start` 失败
- `hostagent` 在 `Starting VZ` 后立即退出
- Docker 无法随 Colima 一起启动

## 原因

这次故障的根因不是 Docker 本身，而是 Lima/Colima 的附加数据盘 `colima` 留下了残留的占用状态。

关键现象：

- Colima 实际使用的 `LIMA_HOME` 是 `~/.colima/_lima`，不是默认的 `~/.lima`
- 在 `~/.colima/_lima/_disks/colima/` 下，存在残留的 `in_use_by` 绑定
- 该绑定仍然指向实例目录 `~/.colima/_lima/colima`
- 于是 VZ 再次启动时，尝试附加这块盘，就会报：
  `failed to run attach disk "colima", in use by instance "colima"`

本质上，这是一次实例退出不干净后留下的磁盘占用标记问题。

## 解决办法

使用 Colima 实际的 `LIMA_HOME` 解锁这块残留占用的数据盘，然后重新启动 Colima：

```bash
env LIMA_HOME=/Users/leo/.colima/_lima limactl disk unlock colima
colima start
```

## 为什么普通的 `limactl disk unlock colima` 不生效

如果直接执行：

```bash
limactl disk unlock colima
```

`limactl` 默认会去看 `~/.lima`，而不是 Colima 使用的 `~/.colima/_lima`。

所以会出现“磁盘不存在”或者根本找不到目标实例的情况，导致看起来像是解锁失败。

## 验证方法

可以用下面几条命令确认问题是否已经解决：

```bash
colima status
env LIMA_HOME=/Users/leo/.colima/_lima limactl list
env LIMA_HOME=/Users/leo/.colima/_lima limactl disk list
docker ps
```

期望结果：

- `colima status` 显示 `colima is running`
- `limactl list` 显示实例 `colima` 为 `Running`
- `limactl disk list` 中 `colima` 磁盘正常被当前实例使用
- `docker ps` 正常返回容器列表

## 额外说明

启动日志里如果看到类似：

```text
failed to set up forwarding tcp port 53 (negligible if already forwarded)
```

这通常只是端口 `53` 已被占用的转发告警，不是这次 Colima 启动失败的根因。

## 一次性排查命令

如果后面再次遇到同类问题，可以按这个顺序排查：

```bash
env LIMA_HOME=/Users/leo/.colima/_lima limactl list
env LIMA_HOME=/Users/leo/.colima/_lima limactl disk list
env LIMA_HOME=/Users/leo/.colima/_lima limactl disk unlock colima
colima start
```
