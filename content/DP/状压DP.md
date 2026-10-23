---
public: true
---
## Tips
当处理合法类问题时，可先dfs预处理单行、双行......的合法状态并标号记录，既可以节约空间，又可以节约时间
### [P1896 [SCOI2005] 互不侵犯](https://www.luogu.com.cn/problem/P1896)
```cpp
#include<bits/stdc++.h>
using namespace std;
long long n,m,tot,st[200],nu[200],f[15][200][100],ans,maxx;
void dfs(int k,int sta,int num){
	if(k>n){
		st[++tot]=sta,nu[tot]=num;
		return;
	}
	dfs(k+1,sta<<1,num);
	if(!(sta&1)) dfs(k+1,(sta<<1)+1,num+1);
}
bool check(int x,int y) {
	if((x&y)||(x&(y<<1))||(x&(y>>1))) return 1;
	return 0;
}
int main() {
	cin>>n>>m;
	dfs(1,0,0);
	f[0][1][0]=1;
	for(int i=1; i<=n; ++i) {
		for(int j=1; j<=tot; ++j) {
			for(int k=1; k<=tot; ++k) {
				if(check(st[j],st[k])) continue;
				for(int al=nu[k];al<=m;++al)
					f[i][k][al]+=f[i-1][j][al-nu[k]];
			}
		}
	}
	for(int k=1; k<=tot; ++k) ans+=f[n][k][m];
	cout<<ans;
	return 0;
}
```
## 例题
### [P3092 [USACO13NOV] No Change G](https://www.luogu.com.cn/problem/P3092)
定义状态 $f_i$ 为花费硬币状态为 $i$ 时最多买到前 $f_i$ 个商品，枚举当前选择的货币 $j$，则有$f[i]=\max(f[i],find(sum[f[i \oplus 2^j]]+C[j]))$。

$find(x)$ 可以通过二分求解。
### [P3694 邦邦的大合唱站队](https://www.luogu.com.cn/problem/P3694)
**题意：** $N$（$N≤10^5$）个人，分别属于 $M$（$M≤20$）个组，要求同组的人站在一起，求最多多少人不用动。

**题解：** 定义 $f_i$ 表示状态为 $i$ 的乐队都排好了要移动的人数，$len$ 表示状态为 $i$ 的乐队的总人数，则 $f[i]=\min(f[i \oplus 2^j]+num[j]−(sum[len][j]−sum[len−num[j]][j]))$
### [P2167 [SDOI2009] Bill的挑战](https://www.luogu.com.cn/problem/P2167)
**题意：**

给出 $n$ 个含问号，并且长度相等的字符串，求有多少方案能使这 $n$ 个字符串中恰好 $k$ 个相等，答案对 $10^6+3$ 取模。

$1≤n≤15$，字符串长度不超过 $50$。

**题解：**

由于 $n$ 很小，可以考虑状压。

定义 $g_{i,j}$ 为第 $i$ 个字符都为 $j$ 时符合条件的状态，$f_{i,j}$ 为 $j$ 状态的字符串前 $i$ 个字符相等时的方案数，直接转移即可。

[code](https://www.luogu.com.cn/record/125071365)
### [P2150 [NOI2015] 寿司晚宴](https://www.luogu.com.cn/problem/P2150)
![[Pasted image 20230918110048.png]]
$n\le500$

**题解：**

可以发现，大于 $\sqrt{500}$ 的因子最多只有 $1$ 个，可以单独考虑。小于 $\sqrt{500}$ 只有八个，可以状压。

定义 $f[i][j]$ 为第 $1/2$ 集合状态为 $i,j$ 时的方案数。

我们把每个数按最大质因子大小排序，定义 $f_1[i][j],f_2[i][j]$ 为同个最大质因子的数放 $1/2$ 集合的方案数，在合并到 $f[i][j]$，即 $f[i][j]=f_1[i][j]+f_2[i][j]-f[i][j]$（减去 $f[i][j]$ 是因为不放的情况会算重）。

**注意：以上数组皆为滚动数组，注意转移顺序。**

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=255,X=300;
int n,p,s[23],f1[X][X],f2[X][X],f[X][X],ans;
struct qwq{int f,st;}a[505];
int main(){
	scanf("%d%d",&n,&p);
	s[2]=1,s[3]=2,s[5]=4,s[7]=8,s[11]=16,s[13]=32,s[17]=64,s[19]=128;
	for(int i=2;i<=n;++i){
		a[i].f=i;
		for(int j=2;j<20;++j) while(a[i].f%j==0) a[i].f/=j,a[i].st|=s[j];
	}
	sort(a+2,a+1+n,[](qwq a,qwq b){return a.f<b.f;}),f[0][0]=1;
	for(int i=2;i<=n;++i){
		if(a[i].f^a[i-1].f||a[i].f==1) memcpy(f1,f,sizeof(f1)),memcpy(f2,f,sizeof(f2));
		for(int j=N;~j;--j)for(int k=N;~k;--k)if(!(j&k)){
			if(!(a[i].st&k)) (f1[j|a[i].st][k]+=f1[j][k])%=p;
			if(!(a[i].st&j)) (f2[j][k|a[i].st]+=f2[j][k])%=p;
		}
		if(a[i].f^a[i+1].f||a[i].f==1)for(int j=N;~j;--j)for(int k=N;~k;--k)if(!(j&k))
			f[j][k]=((f1[j][k]+f2[j][k])%p+p-f[j][k])%p;
	} 
	for(int j=N;~j;--j)for(int k=N;~k;--k)if(!(j&k)) (ans+=f[j][k])%=p;
	printf("%d",ans);
	return 0;
}
```
### [P2157 [SDOI2009] 学校食堂](https://www.luogu.com.cn/problem/P2157)
**题意：**

![[Pasted image 20230918184315.png]]

**题解：**

定义 $f_{i,j,k}$ 为前 $i-1$ 个已全部做好，$[i,i+b_i]$ 个完成状态为 $i$，上一个做的是 $i+k,-8\le k\le7$ 的花费，则：

- $f_{i+1,j>>1,k-1}=\min(f_{i,j,k},f_{i+1,j>>1,k-1}),j\&1$
- $f_{i,j|2^o,o}=\min(f_{i,j,k},f_{i,j|2^o,o}),j\oplus 1$

**注意：**

![[Pasted image 20230918184152.png]]

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1005,M=1<<8;
int t,n,a[N],b[N],mn,f[N][M][20],ans;
#define D(x) (x)+8
void work(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i) scanf("%d%d",&a[i],&b[i]);
	memset(f,127,sizeof(f)),ans=f[1][0][7],f[1][0][7]=0;
	for(int i=1;i<=n;++i){
		for(int j=0;j<M;++j)for(int k=-8;k<=b[i];++k)if(f[i][j][D(k)]^ans){
			if(j&1){f[i+1][j>>1][D(k-1)]=min(f[i][j][D(k)],f[i+1][j>>1][D(k-1)]);continue;}
			mn=7;
			for(int o=0;o<=7;++o)if(!(j&(1<<o))){
				mn=min(mn,b[i+o]+o);
				if(o>mn) break;
				f[i][j|(1<<o)][D(o)]=min(f[i][j|(1<<o)][D(o)],f[i][j][D(k)]+(i+k?a[i+k]^a[i+o]:0));
			}
		}
	}
	for(int i=-8;i<=0;++i) ans=min(ans,f[n][1][D(i)]);
	printf("%d\n",ans);
}
int main(){
	scanf("%d",&t);
	while(t--) work();
	return 0;
}
```
### [P3622 [APIO2007] 动物园](https://www.luogu.com.cn/problem/P3622)
![[Pasted image 20230918081738.png]]

对于 $100\%$ 的数据，$10 \le N \le 10^4$，$1 \le C \le 5\times 10^4$，$1 \le E \le N$。

**题解：**

要注意的是在 dp 之前先枚举前五个的状态 state（第 $0$ 个围栏），因为围栏是一个环，最后枚举第 $n$ 个围栏时，其实就相当于又回到了第 $0$ 个围栏，那么此时必须满足 $s=state$ 才是有效状态，更新答案。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int C=5e4+5,N=1e4+5;
int n,c,e,af,lo,s1,s2,t,f[N][32],num[N][32],ans;
int main(){
	scanf("%d%d",&n,&c);
	for(int i=1;i<=c;++i){
		scanf("%d%d%d",&e,&af,&lo),s1=s2=0;
		for(int j=1;j<=af;++j) scanf("%d",&t),s1+=1<<((t-e+n)%n);
		for(int j=1;j<=lo;++j) scanf("%d",&t),s2+=1<<((t-e+n)%n);
		for(int j=0;j<32;++j){if((j&s1)||(~j&s2)) ++num[e][j];}
	}
	for(int i=0;i<32;++i) f[0][i]=-C; 
	for(int o=0;o<32;++o){//注意环的处理  0==n ！！！ 
		f[0][o]=0;
		for(int i=1;i<=n;++i)
			for(int j=0;j<32;++j)
				f[i][j]=num[i][j]+max(f[i-1][((j&15)<<1)+1],f[i-1][(j&15)<<1]);
		f[0][o]=-C,ans=max(ans,f[n][o]);
	}
	cout<<ans;
	return 0;
}
```

