基于现在项目里面所有改动的文件，分析这些改动，总结改动信息，使用 gh 工具提交一个 pr。提交 commit 之前需要先运行 make qa 命令保证所有代码前置要求符合规范。
要求：
1，如果当前是 main 分支，基于 main 分支提交 PR；
2，如果当前不是 main 分支，先基于当前分支提交commit更新，然后merge origin 的 main 分支；如果当前不是最新的，需要 pull 一下，然后基于 main 重新 merge