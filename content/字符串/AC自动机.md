---
public: true
---
#字符串 
## 模板
<center><font size=6 color=red> 加强：减少跳 fail 边的次数 </font></center>

### [P3808 【模板】AC 自动机（简单版）](https://www.luogu.com.cn/problem/P3808)
给定 $n$ 个模式串和一个文本串，求有模式串是否文本串里**出现过**。

代码：[click](https://www.luogu.com.cn/record/49101662)
### [P3796 【模板】AC 自动机（加强版）](https://www.luogu.com.cn/problem/P3796)
给定 $n$ 个模式串和一个文本串，求模式串在文本串里**出现过的次数**。

代码：[click](https://www.luogu.com.cn/record/49149521)
### [P5357 【模板】AC 自动机（二次加强版）](https://www.luogu.com.cn/problem/P5357)
给定 $n$ 个模式串和一个文本串，求模式串在文本串里**出现过的次数**。

代码：[click](https://www.luogu.com.cn/record/49550332)

- 利用栈减少跳 $fail$ 边的次数
- 建 $fail$ 树

核心（栈）：
```cpp
void bfs(){
	for(int i=0;i<26;++i) ch[0][i]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front();
		q.pop();
		for(int i=0;i<26;++i){
			if(!ch[u][i]) ch[u][i]=ch[nxt[u]][i];
			else{
				q.push(ch[u][i]);
                st.push(ch[u][i]);//入栈
				nxt[ch[u][i]]=ch[nxt[u]][i];
			}
		}
	}
}
void find(string a){
	len=a.size(),u=1;
	for(int i=0;i<len;++i){
		t=a[i]-'a',p=ch[u][t];
		sum[p]++;
		u=ch[u][t];
	}
	while(!st.empty()){//由于栈先入后出，保证先访问到x，在访问nxt[x]
		u=st.top();st.pop();
		sum[nxt[u]]+=sum[u];
	}
}
```
### [P2414 [NOI2011] 阿狸的打字机](https://www.luogu.com.cn/problem/P2414)（我愿称之为三次加强版）
给定 $n$ 个串，多个询问求 $x$ 串在 $y$ 串里**出现过的次数**。

建 $fail$ 树，答案为 $x,y$ 之间节点出现次数之和，考虑树状数组维护。

把 $fail$ 树用 $dfn$ 序铺成序列，重走一遍原 $trie$ 树，每到一个点，我们就 $+1$，回溯的时候 $-1$。

将询问离线按 $y$ 排序。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e5+5;
char s[N];
int n,m,u,tot=1,fa[N],ch[N][26],cnt,id[N],nxt[N],tim,dfn[N],r[N],tr[N],p=1,ans[N];
queue<int>q;
vector<int>vec[N];
struct que{int x,y,I;}a[N];
void bfs(){
	for(int i=0;i<26;++i) ch[0][i]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front(),q.pop();
		for(int i=0;i<26;++i){
			if(!ch[u][i]) ch[u][i]=ch[nxt[u]][i];
			else q.push(ch[u][i]),nxt[ch[u][i]]=ch[nxt[u]][i];
		}
	}
}
bool cmp(que i,que j){return i.y<j.y;}
void dfs(int pos){
	dfn[pos]=++tim;
	for(auto v:vec[pos]) dfs(v);
	r[pos]=tim;
}
void add(int k,int v){for(;k<=tot;k+=k&-k) tr[k]+=v;}
int ask(int k){int re=0;for(;k;k-=k&-k) re+=tr[k];return re;}
int main(){
	scanf("%s",s),n=strlen(s),u=1,fa[1]=1;
	for(int i=0;i<n;++i){
		if(s[i]=='B') u=fa[u];
		else if(s[i]=='P') id[++cnt]=u;
		else{
			if(!ch[u][s[i]-'a']) ch[u][s[i]-'a']=++tot,fa[ch[u][s[i]-'a']]=u;
			u=ch[u][s[i]-'a'];
		}
	}
	bfs();
	for(int i=2;i<=tot;++i) vec[nxt[i]].push_back(i);
	scanf("%d",&m);
	for(int i=1;i<=m;++i) scanf("%d%d",&a[i].x,&a[i].y),a[i].I=i;
	sort(a+1,a+1+m,cmp);
	dfs(1);u=1,cnt=0,add(dfn[1],1);
	for(int i=0;i<n;++i){
		if(s[i]=='B') add(dfn[u],-1),u=fa[u];
		else if(s[i]=='P'){
			++cnt;
			while(p<=m&&a[p].y<=cnt){
				ans[a[p].I]=ask(r[id[a[p].x]])-ask(dfn[id[a[p].x]]-1);
				++p;
			}
		}
		else u=ch[u][s[i]-'a'],add(dfn[u],1);
	}
	for(int i=1;i<=m;++i) printf("%d\n",ans[i]);
	return 0;
}
```
## 例题
### [P2444 [POI2000]病毒](https://www.luogu.com.cn/problem/P2444)
如果可以找到一个没有结束标记的环，就能保证代码安全。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=3e4+5;
int n,ch[N][2],u,tot=1,nxt[N];
char s[N];
bool b[N],vis[N],f[N];
queue<int>q;
void add(){
	int len=strlen(s);
	u=1;
	for(int i=0;i<len;++i){
		if(!ch[u][s[i]-'0']) ch[u][s[i]-'0']=++tot;
		u=ch[u][s[i]-'0'];
	}
	b[u]=1;
}
void bfs(){
	ch[0][0]=ch[0][1]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front();q.pop();
		for(int i=0;i<2;++i){
			if(!ch[u][i]) ch[u][i]=ch[nxt[u]][i];
			else q.push(ch[u][i]),nxt[ch[u][i]]=ch[nxt[u]][i],b[ch[u][i]]|=b[ch[nxt[u]][i]];
			//重点：nxt为u的后缀，若nxt为结尾，u一定包含nxt的结尾点！！！ 
		}
	}
}
void dfs(int k){
	vis[k]=1;
	for(int i=0;i<2;++i){
		u=ch[k][i];
		if(vis[u]){printf("TAK");exit(0);}
		if(!f[u]&&!b[u]) f[u]=1,dfs(u);
	}
	vis[k]=0;
}
int main() {
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%s",s),add();
	bfs();
	dfs(1);
	printf("NIE");
	return 0;
}
```

### [P2322 [HNOI2006]最短母串问题](https://www.luogu.com.cn/problem/P2322)
$n\le12$ ----> 考虑状压

$b[x]$ 表示母串到当前点可以包含的字串

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=605;
int n,ch[N][26],u,tot=1,nxt[N],b[N],maxx,p,pst;
char s[55];
bool vis[1<<12][N];
queue<int>q;
void add(){
	int len=strlen(s);
	u=1;
	for(int i=0;i<len;++i){
		if(!ch[u][s[i]-'A']) ch[u][s[i]-'A']=++tot;
		u=ch[u][s[i]-'A'];
	}
}
void bfs1(){
	for(int i=0;i<26;++i) ch[0][i]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front();q.pop();
		for(int i=0;i<26;++i){
			if(!ch[u][i]) ch[u][i]=ch[nxt[u]][i];
			else q.push(ch[u][i]),nxt[ch[u][i]]=ch[nxt[u]][i],b[ch[u][i]]|=b[ch[nxt[u]][i]];
		}
	}
}
struct node{
	int st,x;
	string a;
}t,ne;
queue<node>Q;
void bfs2(){
	t.x=1,t.st=0,t.a="";
	vis[t.st][t.x]=1;
	Q.push(t);
	while(!Q.empty()){
		t=Q.front(),Q.pop();
		for(int i=0;i<26;++i){
			u=ch[t.x][i];
			if(!vis[t.st][u]){
				p=u,pst=t.st;
				while(p>1) pst|=b[p],p=nxt[p];
				if(pst==maxx){cout<<t.a+char(i+'A');return ;}
				vis[pst][u]=1,Q.push({pst,u,t.a+char(i+'A')});
			}
		}
	}
}
int main() {
	scanf("%d",&n),maxx=(1<<n)-1;
	for(int i=1;i<=n;++i) scanf("%s",s),add(),b[u]|=(1<<(i-1));
	bfs1();
	bfs2();
	return 0;
}
```
### [P4600 [HEOI2012]旅行问题](https://www.luogu.com.cn/problem/P4600)
建 $fail$ 树求 $LCA$ 即可。据说卡倍增，那就上树剖。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e6+5,P=1e9+7;
char s[N];
int t,n,m,fx,fy,sx,sy,tot=1,u,ch[N][26],ans[N],f[N],dep[N],siz[N],son[N],top[N];
vector<int>mat[N],vec[N];
queue<int>q;
void bfs(){
	for(int i=0;i<26;++i) ch[0][i]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front(),q.pop();
		for(int i=0;i<26;++i){
			if(!ch[u][i]) ch[u][i]=ch[f[u]][i];
			else q.push(ch[u][i]),f[ch[u][i]]=ch[f[u]][i];
		}
	}
}
void dfs1(int k){
	dep[k]=dep[f[k]]+1,siz[k]=1;
	int maxx=0;
	for(int v:vec[k]){
		dfs1(v),siz[k]+=siz[v];
		if(siz[v]>maxx) maxx=siz[v],son[k]=v;
	}
}
void dfs2(int k,int tp){
	top[k]=tp;
	if(son[k]) dfs2(son[k],tp);
	for(int v:vec[k])if(v!=son[k]) dfs2(v,v);
}
int lca(int a,int b){
	while(top[a]!=top[b]) (dep[top[a]]>dep[top[b]])?a=f[top[a]]:b=f[top[b]];
	return dep[a]<dep[b]?a:b;
}
int main(){
	scanf("%d",&t);
	for(int o=1;o<=t;++o){
		scanf("%s",s),n=strlen(s),u=1;
		for(int i=0;i<n;++i){
			if(!ch[u][s[i]-'a']) ch[u][s[i]-'a']=++tot,ans[tot]=(26ll*ans[u]+s[i]-'a')%P;
			u=ch[u][s[i]-'a'],mat[o].push_back(u);
		}
	}
	bfs();
	for(int i=2;i<=tot;++i) vec[f[i]].push_back(i);
	dfs1(1),dfs2(1,1);
	scanf("%d",&m);
	for(int i=1;i<=m;++i)
		scanf("%d%d%d%d",&fx,&fy,&sx,&sy),printf("%d\n",ans[lca(mat[fx][fy-1],mat[sx][sy-1])]);
	return 0;
}
```
### AC自动机+DP（典型）
#### [P4052 [JSOI2007]文本生成器](https://www.luogu.com.cn/problem/P4052)

运用“正难则反”，即简单容斥：求长度为 $m$ 的不包含任意单词的文本串。

通常定义 $f[i][j]$ ,表示在 $i$ 节点长度为 $j$ 的方案数。

完整代码：[click](https://www.luogu.com.cn/record/86831101)

核心：
```cpp
f[1][0]=1;
for(int i=1;i<=m;++i){
	al=al*26%mod;
	for(int j=1;j<=tot;++j)
		for(int k=0;k<26;++k)
			if(!b[ch[j][k]]) f[ch[j][k]][i]=M(f[ch[j][k]][i]+f[j][i-1]);
}
for(int i=1;i<=tot;++i) ans=M(ans+f[i][m]);
printf("%d",M(al+mod-ans));
```
#### [P3311 [SDOI2014] 数数](https://www.luogu.com.cn/problem/P3311)
和上一题几乎一样，不过 dp 时要多记录一维 $0/1$ 表示是否受最高位限制。

同时，由于文本串没有前导 $0$，而模式串有，可以在建完 AC 自动机后删掉 $ch[rt][0]$。
#### [P2292 [HNOI2004] L 语言](https://www.luogu.com.cn/problem/P2292)
![[Pasted image 20230919131614.png]]

**题解：**

首先，肯定是先对模式串建 AC 自动机。

可以发现，若 $v$ 在 fail 树上是 $u$ 的祖先，则 $v$ 为 $u$ 的后缀。由于文本串的长度不超过 $20$，可以状压 $g_u$ 表示 $u$ 是否存在长度为 $k$ 的模式串后缀。

定义 $dp_i$ 表示主串前缀 $i$ 能否匹配，状压记录 $[i-20,i-1]$ 的 $dp$，记在 AC 自动机上匹配到 $u$，若 $g_u \& x$ 存在，说明可以转移。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=2e6+5,M=405,mx=(1<<20)-1;
char s[25],t[N];
int n,m,l,u=1,tot=1,ch[M][26],b[M],f[M],d[M],g[M],x,dp[N];
queue<int>q;
void bfs(){
	for(int i=0;i<26;++i) ch[0][i]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front(),q.pop();
		for(int i=0;i<26;++i){
			if(!ch[u][i]) ch[u][i]=ch[f[u]][i];
			else q.push(ch[u][i]),f[ch[u][i]]=ch[f[u]][i];
		}
	}
}
void work(){
	scanf("%s",t),l=strlen(t),u=1,x=1;
	for(int i=0;i<l;++i)
		u=ch[u][t[i]-'a'],dp[i]=((g[u]&x)!=0),x=((x<<1)|dp[i])&mx;
	for(int i=l-1;~i;--i)if(dp[i]){printf("%d\n",i+1);return;}
	printf("0\n");
}
int main(){
	scanf("%d%d",&n,&m);
	for(int i=1;i<=n;++i){
		scanf("%s",s),l=strlen(s),u=1;
		for(int j=0;j<l;++j){
			if(!ch[u][s[j]-'a']) ch[u][s[j]-'a']=++tot;
			u=ch[u][s[j]-'a'];
		}
		b[u]=1,d[u]=l;
	}
	bfs();
	for(int i=2;i<=tot;++i){
		u=i;
		while(u!=1) g[i]|=d[u]>10?0:b[u]<<(d[u]-1),u=f[u];
	}
	while(m--) work();
	return 0;
}
```
#### [P5319 [BJOI2019] 奥术神杖](https://www.luogu.com.cn/problem/P5319)
![](Pasted%20image%2020231020194129.png)

**题解：**

![[Pasted image 20230926192712.png]]

check 函数内在 AC 自动机上 DP，定义 $f_{i,j}$ 为匹配到 $T_i$ 在 AC 自动机上的 $j$ 点的最大 $v'$。

注意，要建 AC 自动机时要加上 $nx$ 的 $sz,c$。

```cpp
#include<bits/stdc++.h>
using namespace std;
#define db double
const int N=1505;
const db eps=1e-6;
char t[N],s[N],ans[N];
int n,m,len,tot=1,u,ch[N][10],sz[N],nx[N],pr[N][N],cc[N][N],id;
db v,c[N],l,r,mi,f[N][N];
queue<int>q;
void bfs(){
	for(int i=0;i<10;++i) ch[0][i]=1;
	q.push(1);
	while(!q.empty()){
		u=q.front(),q.pop(),sz[u]+=sz[nx[u]],c[u]+=c[nx[u]];
		for(int i=0;i<10;++i)
			if(!ch[u][i]) ch[u][i]=ch[nx[u]][i];
			else nx[ch[u][i]]=ch[nx[u]][i],q.push(ch[u][i]);
	}
}
int check(){
	for(int i=2;i<=tot;++i)if(sz[i]) c[i]-=sz[i]*mi;
	for(int i=0;i<=n;++i)for(int j=1;j<=tot;++j) f[i][j]=-1e18;
	f[0][1]=0;
	for(int i=0;i<n;++i)for(int j=1;j<=tot;++j)for(int k=0;k<10;++k)
		if((t[i]=='.'||k==t[i]-'0')&&f[i][j]+c[ch[j][k]]>f[i+1][ch[j][k]])
			f[i+1][ch[j][k]]=f[i][j]+c[ch[j][k]],pr[i+1][ch[j][k]]=j,cc[i+1][ch[j][k]]=k;
	for(int i=2;i<=tot;++i)if(sz[i]) c[i]+=sz[i]*mi;
	id=1;
	for(int i=2;i<=tot;++i)if(f[n][id]<f[n][i]) id=i;
	return f[n][id]>0;
}
int main(){
	scanf("%d%d%s",&n,&m,t);
	for(int i=1;i<=m;++i){
		scanf("%s%lf",s,&v);
		v=log2(v),len=strlen(s),u=1;
		for(int j=0;j<len;++j){
			if(!ch[u][s[j]-'0']) ch[u][s[j]-'0']=++tot;
			u=ch[u][s[j]-'0'];
		}
		++sz[u],c[u]+=v,r=max(r,v);
	}
	bfs();
	while(l+eps<r){
		mi=(l+r)/2;
		if(check()) l=mi;
		else r=mi;
	}
	mi=l,check();
	for(int i=n;i;id=pr[i][id],--i) ans[i]=cc[i][id]+'0';
	for(int i=1;i<=n;++i) printf("%c",ans[i]);
	return 0;
}
```
