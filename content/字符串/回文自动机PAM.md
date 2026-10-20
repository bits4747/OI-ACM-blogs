---
public: true
---
#字符串 
## [P5496 【模板】回文自动机（PAM）](https://www.luogu.com.cn/problem/P5496)
### 讲解安利：[~~大~~ 部分转载](https://www.luogu.com.cn/blog/luotianze/solution-p5496)
建两棵回文树，分别表示奇偶回文串。树边表示字符，从下往上再往下读（奇回文树上最顶上的边只能读 $1$ 次），这样每个节点都代表一个回文子串。

可以发现，每新增一个字符最多新增一个本质不同的回文串，即多添加一个节点。

![[Pasted image 20230926192118.png]]

![[Pasted image 20230926192125.png]]

关于空节点 $0,1$ 之间的 $fail$ 边，是为了方便奇偶回文串之间的转换，可手动模拟理解。

![[Pasted image 20230926192134.png]]

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=5e5+5;
char s[N];
int n,tot=1,ch[N][26],f[N],l[N],cnt[N],u,la;//f--fail指针 l--len (cnt--以i结尾的回文子串个数)
int getfail(int x,int i){
	while(i-l[x]-1<0||s[i-l[x]-1]!=s[i]) x=f[x];
	return x;
}
int main(){
	scanf("%s",s),n=strlen(s),f[0]=1,l[1]=-1;
	for(int i=0;i<n;++i){
		if(i) s[i]=(s[i]-97+la)%26+97;//题目输入加密
		u=getfail(u,i);
		if(!ch[u][s[i]-'a'])
			f[++tot]=ch[getfail(f[u],i)][s[i]-'a'],ch[u][s[i]-'a']=tot,l[tot]=l[u]+2,cnt[tot]=cnt[f[tot]]+1;
		u=ch[u][s[i]-'a'],la=cnt[u],printf("%d ",la);
	}
	return 0;
}
```
## [P3649 [APIO2014] 回文串](https://www.luogu.com.cn/problem/P3649)
板子
## [P4555 [国家集训队] 最长双回文串](https://www.luogu.com.cn/problem/P4555)
正着一棵，反着一棵

[code](https://www.luogu.com.cn/record/101573151)
## [P5555 秩序魔咒](https://www.luogu.com.cn/problem/P5555)
题意：给出两个字符串，求最长公共回文子串的长度和数量

建两个回文自动机，$dfs$ 公共部分并统计。

```cpp
void dfs(int u0,int u1){
	if(s[0].l[u0]==ans) ++sum;
	if(s[0].l[u0]>ans) ans=s[0].l[u0],sum=1;
	for(int i=0;i<26;++i)
		if(s[0].ch[u0][i]&&s[1].ch[u1][i]) dfs(s[0].ch[u0][i],s[1].ch[u1][i]);
}
```
[code](https://www.luogu.com.cn/record/101263183)
## [P5685 [JSOI2013]快乐的 JYY](https://www.luogu.com.cn/problem/P5685)
与上题极度相似
```cpp
void dfs(int u0,int u1){
	if(u0>1) ans+=1ll*s[0].sum[u0]*s[1].sum[u1];
	for(int i=0;i<26;++i)
		if(s[0].ch[u0][i]&&s[1].ch[u1][i]) dfs(s[0].ch[u0][i],s[1].ch[u1][i]);
}
```
[code](https://www.luogu.com.cn/record/101293367)
## [Palisection](https://www.luogu.com.cn/problem/CF17E)
正难则反，考虑求不相交的回文串对数。

变成 [[回文自动机PAM#[P4555 [国家集训队] 最长双回文串](https://www.luogu.com.cn/problem/P4555)]]

但本题精华在于卡空间。
### 引入新知识点：用链表存储回文树
思想：以时间换空间，将 $ch[u][26]$ 用链表存储，节省无用空间。
```cpp
struct line{int nt,to,w;}b[N];//nx--上一条边，to--这条边通向的节点编号，w--这条边代表的字符
int getson(int u,int c){
	for(int i=h[u];i!=-1;i=b[i].nt) if(b[i].w==c) return b[i].to;
	return -1;
}
void add(int i,int c){
	u=getfail(u,i);
	if(getson(u,c)==-1){
		tmp=getson(getfail(f[u],i),c);
		f[++tot]=(tmp==-1?0:tmp),l[tot]=l[u]+2,sum[tot]=sum[f[tot]]+1;
		b[++cnt]=(line){h[u],tot,c},h[u]=cnt;
	}
	u=getson(u,c);
}
```
[code](https://www.luogu.com.cn/record/101329444)
## [P4287 [SHOI2011]双倍回文](https://www.luogu.com.cn/problem/P4287)
### 引入新知识点：$trans$ 指针

定义：指向小于等于当前节点一半的最长回文后缀。
```cpp
int getfail(int x,int i){while(i-l[x]-1<0||s[i-l[x]-1]!=s[i]) x=f[x];return x;}
int gettrans(int x,int i){while((l[x]+2)*2>l[tot]||s[i-l[x]-1]!=s[i]) x=f[x];return x;}
int main(){
	for(int i=0;i<n;++i){
		u=getfail(u,i);
		if(!ch[u][s[i]-'a'])
			l[++tot]=l[u]+2,f[tot]=ch[getfail(f[u],i)][s[i]-'a'],
			t[tot]=(l[tot]<=2?f[u]:ch[gettrans(t[u],i)][s[i]-'a']),ch[u][s[i]-'a']=tot;//注意l<=2特殊情况
		u=ch[u][s[i]-'a'];
	}
	return 0;
}
```
[code](https://www.luogu.com.cn/record/101252225)
## [P4762 [CERC2014]Virus synthesis](https://www.luogu.com.cn/problem/P4762)
### ★ PAM+DP
可以发现，最优解一定为回文子串 + 一个一个补全剩余字符

考虑在 $PAM$ 上 $dp$，记 $dp[i]$ 表示走到 $i$ 节点最小需要的操作次数。

有两种转移方式：
- $dp[ch[u][i]]=dp[u]+1$ ：子节点可以在当前节点翻转前先增加 $1$ 个字符
- $dp[u]=dp[trans[u]]+l[u]/2-l[trans[u]]+1$ ：先在 $trans[u]$ 的基础上补全再花费一次操作翻转


初始化 $dp[u]=l[u]$（直接一个一个加）。

注意：
- 由于无法通过翻转得到奇回文串，所以只 $dp$ 偶回文树，因此一定要初始化（不然当 $trans[u]$ 为奇回文串时会出 $bug$）。
- $bfs$ 保证更新 $u$ 时 $trans[u]$ 已更新完毕。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e5+5;
char s[N];
int T,n,u,tot,ch[N][4],l[N],dp[N],f[N],t[N],ans;
queue<int>q;
int getfail(int x,int i){while(i-l[x]-1<0||s[i-l[x]-1]!=s[i]) x=f[x];return x;}
int gettrans(int x,int i){while((l[x]+2)<<1>l[tot]||s[i-l[x]-1]!=s[i]) x=f[x];return x;} 
void add(int i,int c){
	u=getfail(u,i);
	if(!ch[u][c])
		l[++tot]=l[u]+2,dp[tot]=l[tot],f[tot]=ch[getfail(f[u],i)][c],
		t[tot]=(l[tot]<=2?0:ch[gettrans(t[u],i)][c]),ch[u][c]=tot;
	u=ch[u][c];
}
void bfs(){
	q.push(0);dp[0]=1;
	while(!q.empty()){
		u=q.front(),q.pop();
		if(t[u]) dp[u]=min(dp[t[u]]+(l[u]>>1)-l[t[u]]+1,dp[u]);
		for(int i=0;i<4;++i)if(ch[u][i]) dp[ch[u][i]]=dp[u]+1,q.push(ch[u][i]);
		ans=min(ans,dp[u]+n-l[u]);
	}
}
int main(){
	scanf("%d",&T);
	while(T--){
		scanf("%s",s),n=strlen(s);
		for(int i=0;i<=tot;++i) ch[i][0]=ch[i][1]=ch[i][2]=ch[i][3]=l[i]=f[i]=t[i]=dp[i]=0;
		f[0]=1,l[1]=-1,u=0,tot=1;
		for(int i=0;i<n;++i) add(i,s[i]=='A'?0:(s[i]=='T'?1:(s[i]=='C'?2:3)));
		ans=n;bfs();
		printf("%d\n",ans);
	}
	return 0;
}
```
## 最小回文划分
[证明讲解(引用)](https://oiwiki.org/string/pam/#%E6%9C%80%E5%B0%8F%E5%9B%9E%E6%96%87%E5%88%92%E5%88%86)

### 重要结论：$s$ 的所有回文后缀按照长度排序后，可以划分成 $\log |s|$ 段等差数列。

### [模板](https://www.luogu.com.cn/problem/UVA11584)
朴素 $O(N^2)~DP$ ，记 $dp[i]$ 表示到 $i$ 为止的最小划分数：
 
$$dp[i]=1+\min_{ s[j+1..i] \text{ 为回文串} } dp[j]$$

利用 $PAM$ 和上述重要结论优化 $DP$。

回文树上的每个节点 $u$ 需要多维护两个信息，$diff[u]$ 和 $slink[u]$。

$diff[u]$ 表示节点 $u$ 和 $fail[u]$ 所代表的回文串的**长度差**，即 $len[u]-len[fail[u]]$。

$slink[u]$ 表示 $u$ 一直沿着 $fail$ 向上跳到第一个节点 $v$，使得 $diff[v] \neq diff[u]$，也就是 **$u$ 所在等差数列中长度最小的那个节点（或者上一个等差数列的结尾点）**。

根据上面证明的结论，如果使用 $slink$ 指针向上跳的话，每向后添加一个字符，只需要向上跳 $O(\log |s|)$ 次。因此，可以考虑将一个等差数列表示的所有回文串的 $dp$ 值的 $min$，记录到最长的那一个回文串对应节点上。

![[Pasted image 20230926192151.png]]

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e6+5;
char s[N];
int T,n,u,p,tot=1,ch[N][26],f[N],l[N],d[N],sl[N],dp[N],g[N];
int getfail(int x,int i){while(s[i-l[x]-1]!=s[i]) x=f[x];return x;}
int main(){
	scanf("%d",&T);
	while(T--){
		scanf("%s",s+1),n=strlen(s+1);
		for(int i=0;i<=tot;++i)for(int j=0;j<26;++j) ch[i][j]=0;
		f[0]=1,f[1]=0,l[0]=0,l[1]=-1,tot=1,u=0;
		memset(dp,127,sizeof(dp)),dp[0]=0;
		for(int i=1;i<=n;++i){
			u=getfail(u,i);
			if(!ch[u][s[i]-'a']){
				f[++tot]=ch[getfail(f[u],i)][s[i]-'a'],l[tot]=l[u]+2,ch[u][s[i]-'a']=tot;
				d[tot]=l[tot]-l[f[tot]],sl[tot]=(d[tot]==d[f[tot]]?sl[f[tot]]:f[tot]);
			}
			u=ch[u][s[i]-'a'];
			for(int x=u;x;x=sl[x]){
				g[x]=dp[i-l[sl[x]]-d[x]]+1;
				if(f[x]!=sl[x]) g[x]=min(g[x],g[f[x]]);
				dp[i]=min(g[x],dp[i]);
			}
		}
		printf("%d\n",dp[n]);
	}
	return 0;
}
```
### [Palindrome Partition](https://www.luogu.com.cn/problem/CF932G)
#### 常见套路：字符相等-->扭曲字符串变成回文串
此题将后半段字符串翻转插入前半段中，变成求偶回文划分方案数。

如：
$abccdbabccdb$
$abbdccccdbba$

[code](https://www.luogu.com.cn/record/101379107)

### [Reverses](https://www.luogu.com.cn/problem/CF906E)
同上，扭曲字符串，把两个串交错拼接起来，求最小偶回文划分。

$abcxxxdef+cbaxxxfed==>acbbcaxxxxxxdfeefd$

类似上一题，但需要记录 $dp$ 转移路径，且当 $s_i=s_{i-1}$ 时无需划分操作。

[code](https://www.luogu.com.cn/record/101444767)
