---
public: true
---
#字符串 

图文详解：

[https://www.luogu.com.cn/blog/Kesdiael3/hou-zhui-zi-dong-ji-yang-xie](https://www.luogu.com.cn/blog/Kesdiael3/hou-zhui-zi-dong-ji-yang-xie)

[https://oiwiki.com/string/sam/](https://oiwiki.com/string/sam/)

应用详解：

[https://www.luogu.com.cn/blog/command-block/hou-zhui-zi-dong-ji-xue-xi-bi-ji-ying-yong-pian-post](https://www.luogu.com.cn/blog/command-block/hou-zhui-zi-dong-ji-xue-xi-bi-ji-ying-yong-pian-post)
## 定义与性质
- 每一个节点代表一个 $endpos$ 等价类
- 一个后缀链接 $link(u)$ 连接到对应于 $u$ 的最长后缀的另一个 $endpos$ 等价类的状态
-  $link(u)$ 同为 $fa(u)$ ，表示 $u$ 在 $parent~tree$ 上的父亲
- 我们记 $len(u)$ 为 $u$ 代表的 $endpos$ 等价类中最长的一个字符串的长度。
- $parent~tree$ 上父亲代表的 $endpos$ 包含儿子的，父亲是儿子的后缀... ...
## 模板
```cpp
void add(int c){
	p=las,las=np=++tot,a[np].len=a[p].len+1;
	while(p&&!a[p].ch[c]) a[p].ch[c]=np,p=a[p].fa;
	if(!p){a[np].fa=1;return ;}
	q=a[p].ch[c];
	if(a[q].len==a[p].len+1){a[np].fa=q;return ;}
	nq=++tot,a[nq]=a[q],a[q].fa=a[np].fa=nq,a[nq].len=a[p].len+1;
	while(p&&a[p].ch[c]==q) a[p].ch[c]=nq,p=a[p].fa;
}
```
## 本质不同子串个数
1. ## [P2408 不同子串个数](https://www.luogu.com.cn/problem/P2408)
    
    直接在 $SAM$ 上 $DP$，$cnt[i]+=\sum cnt[ch[i][j]]$
    
    [code](https://www.luogu.com.cn/record/101699856)
    
3. ## [P4070 [SDOI2016]生成魔咒](https://www.luogu.com.cn/problem/P4070)

     $\sum len(i)−len(fa(i))$（可动态维护本质不同子串个数）

    [code](https://www.luogu.com.cn/record/84720654)
## 出现次数
### [P3804 【模板】后缀自动机 (SAM)](https://www.luogu.com.cn/problem/P3804)
建 parent tree 后，$cnt[i]$表示节点 $i$ 出现次数

$$cnt[i]+=\sum_{j∈son_{i} ~on~parent~tree}cnt[j]$$

[code](https://www.luogu.com.cn/record/84640301)
### [P5341 [TJOI2019] 甲苯先生和大中锋的字符串](https://www.luogu.com.cn/problem/P5341)
![[Pasted image 20230921160851.png]]

按以上方法求出 parent tree 上每个节点出现的次数，每个节点代表 $[len_{fa_u},len_u)$ 个长度为 $[len_{fa_u},len_u)$ 的节点。

运用差分统计长度为 $i$ 的串恰好重复 $k$ 次的个数。

[code](https://www.luogu.com.cn/record/125425583)
## 与AC自动机的相似性
- $SAM$ 可以理解为对字符串的所有后缀建 $AC$ 自动机，可以在上面跑匹配
### 字典序第K的子串
#### [P3975 [TJOI2015]弦论](https://www.luogu.com.cn/problem/P3975)
先预处理每个节点子树内不同子串的个数（不要求本质不同时初始值为当前节点的出现次数）。

从根出发模拟即可。

[code](https://www.luogu.com.cn/record/84385400)
### 最小循环移位
对 $S+S$ 建好 $SAM$ 后贪心跑最小边。

另有[[最小表示法]]。
### 两个字符串的最长公共子串
#### [LCS - Longest Common Substring](https://www.luogu.com.cn/problem/SP1811)
对字符串 $S$ 建 $SAM$，字符串 $T$ 在 $SAM$ 上匹配，匹配不到就跳 $link$ 边（类似 $AC$ 自动机）。
```cpp
for(int i=0;i<m;++i){
	ans=max(ans,sum);
	x=b[i]-'a';
	if(a[pos].ch[x]){++sum,pos=a[pos].ch[x];continue;}
	while(pos&&!a[pos].ch[x]) pos=a[pos].fa;
	if(!pos){sum=0,pos=1;continue;}
	sum=a[pos].len+1,pos=a[pos].ch[x];
	//注意！！！不能pos=a[pos].ch[x]，sum=a[pos].len，因为len代表此endpos集合最长串的长度
}
```
[code](https://www.luogu.com.cn/record/84747814)
### 多个字符串的最长公共子串
#### [LCS2 - Longest Common Substring II](https://www.luogu.com.cn/problem/SP1812)
对第一个串建 $SAM$，其他串都在 $SAM$ 上匹配，每个串记录下它匹配到 $SAM$ 上节点的最长长度 $mx[i]$，再对不同串的 $mx[i]$ 取 $min$。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=2e5+5;
char s[N>>1];
int n,m,p,np,q,nq,x,tot=1,las=1,l,ma[N],mi[N],ans;
vector<int>vec[N];
struct PAM{int ch[26],fa,len;}a[N];
void add(int c){
	p=las,np=las=++tot,a[np].len=a[p].len+1;
	while(p&&!a[p].ch[c]) a[p].ch[c]=np,p=a[p].fa;
	if(!p) return a[np].fa=1,void();
	q=a[p].ch[c];
	if(a[q].len==a[p].len+1) return a[np].fa=q,void();
	nq=++tot,a[nq]=a[q],a[q].fa=a[np].fa=nq,a[nq].len=a[p].len+1;
	while(p&&a[p].ch[c]==q) a[p].ch[c]=nq,p=a[p].fa;
}
void dfs(int u){
	for(int v:vec[u]) dfs(v),ma[u]=max(ma[u],ma[v]);//儿子匹配得到父亲也行
	mi[u]=min(mi[u],min(a[u].len,ma[u]));
}
int main(){
	scanf("%s",s),n=strlen(s);
	for(int i=0;i<n;++i) add(s[i]-'a');
	for(int i=1;i<=tot;++i) mi[i]=n,vec[a[i].fa].push_back(i);
	while(scanf("%s",s)!=EOF){
		n=strlen(s),p=1,l=0;
		for(int i=1;i<=tot;++i) ma[i]=0;
		for(int i=0;i<n;++i){
			ma[p]=max(ma[p],l),x=s[i]-'a';
			if(a[p].ch[x]){++l,p=a[p].ch[x];continue;}
			while(p&&!a[p].ch[x]) p=a[p].fa;
			if(!p){p=1;continue;}
			l=a[p].len+1,p=a[p].ch[x];
		}
		ma[p]=max(ma[p],l),dfs(1);
	}
	for(int i=1;i<=tot;++i) ans=max(ans,mi[i]);
	printf("%d",ans);
	return 0;
}
```
### 其他
#### [P6640 [BJOI2020] 封印](https://www.luogu.com.cn/problem/P6640)
![[Pasted image 20230921111711.png]]
**题解：**

对 $T$ 建 $SAM$，$S$ 在 $T$ 上跑匹配，$l_i$ 为到 $i$ 为止 $S$ 可匹配的最大长度。

$$ans=max_{i\in[L,R]} \left\{{\min(l_i ,i−L+1) } \right\}$$

当$l_i \leq i−L+1$，即 $L \leq i−l_i+1$ 时，$ans=\max {l_i}$，否则为 $i−L+1$ 。

记 $f_i=i−l_i+1$ ，可以发现 $f_i$ 单调不降。（如果 $f_i ＞f_{i+1}$ ，$i+1$ 还可以往前匹配）

所以二分。

[code](https://www.luogu.com.cn/record/101809246)
#### [CF235C Cyclical Quest](https://www.luogu.com.cn/problem/CF235C)
![[Pasted image 20230921112406.png]]

**题解：**

倍长，跑匹配，当匹配长度为原串长时：
1. 标记，更新答案，加上 $p$ 的出现次数
2. 匹配长度 $-1$
3. 如果 $father$ 的长度为 $l-1$ 跳 $father$ 

[code](https://www.luogu.com.cn/record/101816877)
## ★ 线段树合并维护子串endpos集合
- 给出一个字符串 $S$，$Q$ 个操作，每个操作有 $L, R, T$，求字典序最小的 $S_1$，使得 $S_1$ 为 $S[L..R]$ 的子串，且 $S_1$ 的字典序严格大于 $T$。输出这个 $S_1$，如果无解输出 $-1$。

先不考虑 $s$ 的 $[l,r]$ 区间限制，简单的贪心思路就是 $t$ 一路在 $s$ 的 $SAM$ 上匹配，可以匹配到 $k$ 位，再在后面添加最小的大于 $t[k]$ 的可以在 $s$ 的 $SAM$ 匹配的字符（当 $k==t.size()$ 时无大小限制），如果不存在就退一位，直到 $k=0$ 无解。

加上区间限制，考虑如何判断 $SAM$ 上 $p$ 点所代表的 $endpos$ 集合里是否存在在区间 $[L,R]$ 里的字符串。

可以对 $SAM$ 上的每一个节点维护一棵值域线段树（当然为了不炸空间要动态开点），记录当前点代表的 $endpos$ 集合所包含的子串的结束位置。
```cpp
void change(int &k,int l,int r){
	if(!k) k=++cnt;
	if(l==r){tr[k]=1;return ;}
	int mi=(l+r)>>1;
	if(x<=mi) change(ls[k],l,mi);
	else change(rs[k],mi+1,r);
	tr[k]=tr[ls[k]]+tr[rs[k]];
}
for(int i=1;i<=n;++i) add(s[i]-'a'),x=i,change(rt[las],1,n);
//las--新增节点  x--以x结尾的子串
```
由于在 $parent~tree$ 上，父亲节点代表的 $endpos$ 集合包含儿子节点代表的 $endpos$ 集合，建好 $parent~tree$ 后进行线段树合并，就成功维护了 $SAM$ 上所有点代表的 $endpos$ 集合所包含的子串的结束位置。
```cpp
//注意！！！
//这里线段树合并要分清是否能销毁儿子的线段树，最好采用新建另一颗线段树的合并方式
int merge(int k1,int k2,int l,int r){
	if(!k1||!k2) return k1+k2;
	int mi=(l+r)>>1,nk=++cnt;
	if(l==r){tr[nk]=tr[k1]+tr[k2];return nk;}
	ls[nk]=merge(ls[k1],ls[k2],l,mi),rs[nk]=merge(rs[k1],rs[k2],mi+1,r);
	tr[nk]=tr[ls[nk]]+tr[rs[nk]];
	return nk;
}
void dfs(int u){for(int v:vec[u]) dfs(v),rt[u]=merge(rt[u],rt[v],1,n);}
for(int i=2;i<=tot;++i) vec[a[i].fa].push_back(i);
```
有了这个信息后，可以轻松判断判断 $SAM$ 上 $p$ 点所代表的 $endpos$ 集合里是否存在在区间 $[L,R]$ 里的字符串，只需查询 $p$ 点线段树上是否存在以 $[L+l,R]$ 结尾字符串。
```cpp
int ask(int k,int l,int r){
	if(!k||x>y) return 0;
	if(x<=l&&r<=y) return tr[k];
	int mi=(l+r)>>1;
	if(x<=mi&&y>mi) return ask(ls[k],l,mi)+ask(rs[k],mi+1,r);
	if(x<=mi) return ask(ls[k],l,mi);
	return ask(rs[k],mi+1,r);
}

x=L+l,y=R;
if(a[p].ch[c]&&ask(rt[a[p].ch[c]],1,n)) ...
```
此外，线段树不仅可以记录当前点代表的 $endpos$ 集合所包含的子串的结束位置，还可以记录当前点代表的 $endpos$ 集合所包含的子串的最大最小长度等信息，对线段树维护的信息稍加转变可以解决很多问题。
### 模板 [CF1037H Security](https://www.luogu.com.cn/problem/CF1037H)
以上为解
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=2e5+5,M=8e6+5;
char s[N];
int n,Q,L,R,m,tot=1,las=1,p,np,q,nq,x,y,cnt,rt[N],ls[M],rs[M],tr[M];
struct node{int ch[26],len,fa;}a[N];
void add(int c){
	p=las,np=las=++tot,a[np].len=a[p].len+1;
	while(p&&!a[p].ch[c]) a[p].ch[c]=np,p=a[p].fa;
	if(!p){a[np].fa=1;return ;}
	q=a[p].ch[c];
	if(a[q].len==a[p].len+1){a[np].fa=q;return ;}
	a[nq=++tot]=a[q],a[np].fa=a[q].fa=nq,a[nq].len=a[p].len+1;
	while(p&&a[p].ch[c]==q) a[p].ch[c]=nq,p=a[p].fa;
}
void change(int &k,int l,int r){
	if(!k) k=++cnt;
	if(l==r){tr[k]=1;return ;}
	int mi=(l+r)>>1;
	if(x<=mi) change(ls[k],l,mi);
	else change(rs[k],mi+1,r);
	tr[k]=tr[ls[k]]+tr[rs[k]];
}
int merge(int k1,int k2,int l,int r){
	if(!k1||!k2) return k1+k2;
	int mi=(l+r)>>1,nk=++cnt;
	if(l==r){tr[nk]=tr[k1]+tr[k2];return nk;}
	ls[nk]=merge(ls[k1],ls[k2],l,mi),rs[nk]=merge(rs[k1],rs[k2],mi+1,r);
	tr[nk]=tr[ls[nk]]+tr[rs[nk]];
	return nk;
}
int ask(int k,int l,int r){
	if(!k||x>y) return 0;
	if(x<=l&&r<=y) return tr[k];
	int mi=(l+r)>>1;
	if(x<=mi&&y>mi) return ask(ls[k],l,mi)+ask(rs[k],mi+1,r);
	if(x<=mi) return ask(ls[k],l,mi);
	return ask(rs[k],mi+1,r);
}
vector<int>vec[N];
void dfs(int u){for(int v:vec[u]) dfs(v),rt[u]=merge(rt[u],rt[v],1,n);}
int judge(int u,int l){
	int c=(l==m?-1:s[l+1]-'a');x=L+l,y=R;
	if(c>=0&&a[u].ch[c]&&ask(rt[a[u].ch[c]],1,n)&&judge(a[u].ch[c],l+1)) return 1;
	x=L+l,y=R;
	for(int i=c+1;i<26;++i)
		if(a[u].ch[i]&&ask(rt[a[u].ch[i]],1,n)){
			for(int j=1;j<=l;++j) putchar(s[j]);
			putchar(i+'a'),printf("\n");return 1;
		}
	return 0;
}
int main(){
	scanf("%s",s+1),n=strlen(s+1);
	for(int i=1;i<=n;++i) add(s[i]-'a'),x=i,change(rt[las],1,n);
	for(int i=2;i<=tot;++i) vec[a[i].fa].push_back(i);
	dfs(1);
	scanf("%d",&Q);
	while(Q--){
		scanf("%d%d%s",&L,&R,s+1),m=strlen(s+1);
		if(!judge(1,0)) printf("-1\n");
	}
	return 0;
}
```
### [P4094 [HEOI2016/TJOI2016]字符串](https://www.luogu.com.cn/problem/P4094)
![[Pasted image 20230921114132.png]]

二分 $LCP$ 长度，找到对应点一直跳 $father$ ，直到最后一个 $len \ge mid$。

判断$p$ 点所代表的 $endpos$ 集合里是否存在在区间 $[A+mid-1,B]$ 里的串。
```cpp
int check(int k,int le){
	p=mt[k];
	if(a[p].len<le) return 0;
	while(p&&a[a[p].fa].len>=le) p=a[p].fa;
	x=A+le-1,y=B;
	return ask(rt[p],1,n);
}
for(int i=1;i<=n;++i) add(s[i]-'a'),mt[i]=las,x=i,change(rt[las],1,n);
while(Q--){
	scanf("%d%d%d%d",&A,&B,&C,&D);
	l=0,r=D-C+2;
	while(l+1<r){
		mid=(l+r)>>1;
		if(check(C+mid-1,mid)) l=mid;
		else r=mid;
	}
	printf("%d\n",l);
}
```
[code](https://www.luogu.com.cn/record/101813945)
### [SP687 Repeats](https://www.luogu.com.cn/problem/SP687)
**题意：**

给定字符串，求重复次数最多的连续重复子串。

**题解：**
![[Pasted image 20230921115151.png]]
![[Pasted image 20230921115204.png]]

因此，需要在线段树上维护子串的最大最小长度和子串间最小差值。

```cpp
void pu(int k){
	mi[k]=min(mi[ls[k]],mi[rs[k]]),ma[k]=max(ma[ls[k]],ma[rs[k]]),
	s[k]=min(min(s[ls[k]],s[rs[k]]),mi[rs[k]]-ma[ls[k]]);
}
void change(int &k,int l,int r){
	if(!k) k=++cnt;
	if(l==r) return mi[k]=ma[k]=l,void();
	int mid=(l+r)>>1;
	if(x<=mid) change(ls[k],l,mid);
	else change(rs[k],mid+1,r);
	pu(k);
}
void merge(int &k1,int &k2,int l,int r){
	if(!k1||!k2){k1+=k2;return ;}
	if(l==r){mi[k1]=min(mi[k1],mi[k2]),ma[k1]=max(ma[k1],ma[k2]),s[k1]=min(s[k1],s[k2]);return ;}
	int mid=(l+r)>>1;
	merge(ls[k1],ls[k2],l,mid),merge(rs[k1],rs[k2],mid+1,r);
	pu(k1);
}
void dfs(int u){
	for(int v:vec[u]) dfs(v),merge(rt[u],rt[v],1,n);
	ans=max(ans,a[u].len/s[rt[u]]+1);
}
```
[code](https://www.luogu.com.cn/record/101730272)
### [P4770 [NOI2018] 你的名字](https://www.luogu.com.cn/problem/P4770)
求 $T$ 有多少个本质不同的子串没有在 $S$ 的 $(l,r)$ 中出现。

$T$ 每新增一个字符时新增本质不同子串数量为：$t[i].len-t[t[i].fa].len$

$T$ 每新增一个字符时新增不在 $S$ 的 $(l,r)$ 中的数量为：$t[i].len-s[p].len$ ，其中 $p$ 为当前 $T$ 匹配的最大位置。

**注意：当失配时不能直接跳 $father$ 边，因为每次询问我们提取的是 $S$ 整串的 $SAM$ 的中含有以 $[L+l,R]$ 结尾字符串的部分，而这部分并不是 $S[l,...,R]$ 正真含义的 $SAM$，直接跳 $father$ 边就会忽略一些串。**
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e6+5;
char S[N];
int n,m,Q,tot=1,las=1,lt,p,np,q,nq,x,y,cnt,rt[N],ls[N*40],rs[N*40],tr[N*40],L,R,ch,l,mx[N];
long long ans;
struct node{int ch[26],len,fa,mt;}s[N],t[N<<1];
vector<int>vec[N];
void add(int c,node a[]){
	p=las,np=las=++tot,a[np].len=a[p].len+1;
	while(p&&!a[p].ch[c]) a[p].ch[c]=np,p=a[p].fa;
	if(!p){a[np].fa=1;return ;}
	q=a[p].ch[c];
	if(a[q].len==a[p].len+1){a[np].fa=q;return ;}
	a[nq=++tot]=a[q],a[np].fa=a[q].fa=nq,a[nq].len=a[p].len+1;
	while(p&&a[p].ch[c]==q) a[p].ch[c]=nq,p=a[p].fa;
}
void change(int &k,int l,int r){
	if(!k) k=++cnt;
	if(l==r){tr[k]=1;return ;}
	int mi=(l+r)>>1;
	if(x<=mi) change(ls[k],l,mi);
	else change(rs[k],mi+1,r);
	tr[k]=tr[ls[k]]+tr[rs[k]];
}
int merge(int k1,int k2,int l,int r){
	if(!k1||!k2) return k1+k2;
	int nk=++cnt,mi=(l+r)>>1;
	if(l==r){tr[nk]=tr[k1]+tr[k2];return nk;}
	ls[nk]=merge(ls[k1],ls[k2],l,mi),rs[nk]=merge(rs[k1],rs[k2],mi+1,r);
	return tr[nk]=tr[ls[nk]]+tr[rs[nk]],nk;
}
int ask(int k,int l,int r){
	if(!k||x>y) return 0;
	if(x<=l&&r<=y) return tr[k];
	int mi=(l+r)>>1;
	if(x<=mi&&y>mi) return ask(ls[k],l,mi)+ask(rs[k],mi+1,r);
	if(x<=mi) return ask(ls[k],l,mi);
	return ask(rs[k],mi+1,r);
}
void dfs(int u){for(int v:vec[u]) dfs(v),rt[u]=merge(rt[u],rt[v],1,n);}
int main(){
	scanf("%s",S+1),n=strlen(S+1);
	for(int i=1;i<=n;++i) add(S[i]-'a',s),x=i,change(rt[las],1,n);
	for(int i=2;i<=tot;++i) vec[s[i].fa].push_back(i);
	dfs(1);
	scanf("%d",&Q),tot=1,lt=0; 
	while(Q--){
		scanf("%s%d%d",S+1,&L,&R),m=strlen(S+1),las=1;
		for(int i=1;i<=m;++i) add(S[i]-'a',t),t[np].mt=i;
		p=1,l=0,ans=0;
		for(int i=1;i<=m;++i){
			ch=S[i]-'a';
			while(1){
				x=l+L,y=R;
				if(s[p].ch[ch]&&ask(rt[s[p].ch[ch]],1,n)){p=s[p].ch[ch],++l;break;}
				if(!l) break;
				--l;
				if(l==s[s[p].fa].len) p=s[p].fa;
			}
			mx[i]=l;
		}
		for(int i=lt+1;i<=tot;++i) ans+=max(0,t[i].len-max(t[t[i].fa].len,mx[t[i].mt]));
		for(int i=1;i<=m;++i) mx[i]=0;
		for(int i=0;i<26;++i) t[1].ch[i]=0;
		printf("%lld\n",ans),lt=tot;
	}
	return 0;
}
```
