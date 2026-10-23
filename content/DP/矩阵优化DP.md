---
public: true
---
#DP  #矩阵
## 矩阵快速幂
```cpp
struct jz{
	__int128 s[4][4];
	jz operator *(const jz &b)const{
		jz t;for(int i=0;i<4;++i)for(int j=0;j<4;++j)t.s[i][j]=0;
		for(int i=0;i<4;++i)for(int j=0;j<4;++j)for(int k=0;k<4;++k)
			t.s[i][j]=(t.s[i][j]+s[i][k]*b.s[k][j]%p+p)%p;
		return t;
	}
}a,e,c;
void poww(jz &a,jz &e,long long l){while(l){if(l&1) e=e*a;a=a*a,l>>=1;}}
```
<font color=red size=5>$$注意：矩阵乘法不符合交换律，要注意是左乘还是右乘！$$</font>

## 线性递推式加速
### 入门
#### [#10221. 「一本通 6.5 例 3」Fibonacci 前 n 项和](https://loj.ac/p/10221)
![在这里插入图片描述](https://img-blog.csdnimg.cn/4056f3d185804194abf14f16c8906cdd.jpeg#pic_center)
##### Fibonacci 前 n 项和公式：
$$S_{n}=f_{n+2}-1$$

证明：

由于$f_{i}=f_{i-1}+f_{i-2}$，把 $f_{n+2}$ 不断往前拆就会发现其变为前 $n$ 项的前缀和且多了一个 $f_{1}$。

[code](https://loj.ac/s/1638604)
#### [P4838 P哥破解密码](https://www.luogu.com.cn/problem/P4838)
严重恶评，最水紫题。

简单的线性DP+矩阵加速，很适合入门练板子。
![在这里插入图片描述](https://img-blog.csdnimg.cn/05477a554aa0431c904910b48f22f3b5.jpeg#pic_center)
```cpp
#include<bits/stdc++.h>
using namespace std;
const int p=19260817;
int T,n;
struct jz{
	int s[3][3];
	jz operator *(const jz &b)const{
		jz t;for(int i=0;i<3;++i)for(int j=0;j<3;++j)t.s[i][j]=0;
		for(int i=0;i<3;++i)for(int j=0;j<3;++j)for(int k=0;k<3;++k)
			t.s[i][j]=(t.s[i][j]+1ll*s[i][k]*b.s[k][j]%p)%p;
		return t;
	}
}a,e,c,aa,ee;
void poww(jz &a,jz &e,int l){while(l){if(l&1) e=e*a;a=a*a,l>>=1;}}
int main(){
	scanf("%d",&T);
	ee.s[0][0]=ee.s[1][1]=ee.s[2][2]=1;
	aa.s[0][0]=aa.s[0][1]=aa.s[0][2]=aa.s[1][0]=aa.s[2][1]=1;
	c.s[0][0]=1;
	while(T--){
		scanf("%d",&n);
		a=aa,e=ee,poww(a,e,n),e=e*c;
		printf("%d\n",(e.s[0][0]+e.s[1][0]+e.s[2][0])%p);
	}
	return 0;
}
```
#### [P3216 [HNOI2011]数学作业](https://www.luogu.com.cn/problem/P3216)
按位数分段+矩阵加速。

$$\begin{bmatrix} f_{i} \\ i \\ 1 \end{bmatrix}= \begin{bmatrix} 10^a&1&1\\ 0&1&1\\0&0&1 \end{bmatrix}\times\begin{bmatrix} f_{i-1} \\ i-1 \\ 1 \end{bmatrix}$$

[code](https://www.luogu.com.cn/record/94398056)
### 进阶
#### [#10222. 「一本通 6.5 例 4」佳佳的 Fibonacci](https://loj.ac/p/10222)
![在这里插入图片描述](https://img-blog.csdnimg.cn/219d6e780a554ff3918e64de70440706.jpeg#pic_center)
[code](https://loj.ac/s/1638607)
#### [P3193 [HNOI2008]GT考试](https://www.luogu.com.cn/problem/P3193)
![在这里插入图片描述](https://img-blog.csdnimg.cn/7117509e91b24904bcc9d3d8a987278f.jpeg#pic_center)
[code](https://www.luogu.com.cn/record/94521019)
#### [P5303 [GXOI/GZOI2019]逼死强迫症](https://www.luogu.com.cn/problem/P5303)
![在这里插入图片描述](https://img-blog.csdnimg.cn/c568a7e8d3104756828d23961bcdd208.jpeg#pic_center)
[code](https://www.luogu.com.cn/record/94449357)
#### [P4967 黑暗打击](https://www.luogu.com.cn/problem/P4967)
这图难点是从复杂的图中提取信息并写出递推式。

![[Pasted image 20230926192203.png]]

然后用个 $4*4$ 的矩阵加速就好了。

[code](https://www.luogu.com.cn/record/94502117)
#### [P1397 [NOI2013] 矩阵游戏](https://www.luogu.com.cn/problem/P1397)
费马小定理+矩阵加速。

$$f_{i}=a\times f_{i-1}+b~~~可以写为：\begin{bmatrix} f_{i} \\ 1 \end{bmatrix}= \begin{bmatrix} a&b\\ 0&1 \end{bmatrix}\times\begin{bmatrix} f_{i-1} \\ 1 \end{bmatrix}$$

$$a_{1}=\begin{bmatrix} a&b\\ 0&1 \end{bmatrix}~~~~~~~~e_{1}= a_{1}^{m-1}$$

$$a_{2}=\begin{bmatrix} c&d\\ 0&1 \end{bmatrix}\times e_{1}~~~~~~~~e_{2}= a_{2}^{n-1}$$

$$ans=e_{2}\times e_{1}\times\begin{bmatrix} f_{1} \\ 1 \end{bmatrix}$$

<font color=red size=5>$$注意：我的状态转移一直是左乘，所以要反过来！$$</font>

观察到 $n,m$ 很大，有 $10^{1000000}$ ，且模数为质数，用费马小定理（$a^{p-1}≡1(mod~p),p为质数且a不是p的倍数$）先对 $n,m \%(p-1)$ ，再矩阵加速。

<font color=red size=5>但是，当 $a,c'(乘了e1后的c)$ 为 $1$ 时不成立，相当于 $f_{i}=f_{i-1}+b/d$ ，看有几个 $b，d'$ 直接模 $p$ 即可。</font>

[code](https://www.luogu.com.cn/record/94853921)
## 图上定长路径问题
![在这里插入图片描述](https://img-blog.csdnimg.cn/27ed1424d5794f1d893035952711a430.jpeg#pic_center)
### [P4159 [SCOI2009] 迷路](https://www.luogu.com.cn/problem/P4159)
观察到边长最多为 $9$ ，考虑将一点拆成九点。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int p=2009;
int n[10],l;
char c;
struct jz{
	int s[90][90];
	jz operator *(const jz &b)const{
		jz t;for(int i=0;i<n[9];++i)for(int j=0;j<n[9];++j) t.s[i][j]=0;
		for(int i=0;i<n[9];++i)for(int j=0;j<n[9];++j)for(int k=0;k<n[9];++k)
			t.s[i][j]=(t.s[i][j]+s[i][k]*b.s[k][j]%p)%p;
		return t;
	}
}e,a;
int main(){
	scanf("%d%d",&n[1],&l);for(int i=2;i<=9;++i) n[i]=n[i-1]+n[1];
	for(int i=0;i<n[9];++i) e.s[i][i]=1;
	for(int i=0;i<n[9];++i)for(int j=0;j<n[9];++j) a.s[i][j]=0;
	for(int i=0;i<n[1];++i)for(int j=1;j<9;++j) a.s[i+n[j]][i+n[j-1]]=1;
	for(int i=0;i<n[1];++i)
		for(int j=0;j<n[1];++j){
			scanf(" %c",&c);
			if(c!='0')
				a.s[i][j+n[c-'0'-1]]=1;
		}
	while(l){
		if(l&1) e=e*a;
		a=a*a,l>>=1;
	}
	printf("%d",e.s[0][n[1]-1]);
	return 0;
}
```
### [P2151 [SDOI2009] HH去散步](https://www.luogu.com.cn/problem/P2151)
因为是无向边且不会沿着刚刚走来的路走回，难以直接处理，考虑把一条边拆成两条并边点转化。

建一条虚边指向起点，最后统计 $\sum s [虚边] [所有到终点的边]$ 。

[code](https://www.luogu.com.cn/record/94189083)
### [P2579 [ZJOI2005]沼泽鳄鱼](https://www.luogu.com.cn/problem/P2579)
食人鱼的运动周期只要有 $2,3,4$ ，总周期只有 $12$ 。

处理出 $a[0-12]$ ，对 $k/12$ 做矩阵加速再乘上余数即可。

[code](https://www.luogu.com.cn/record/94190511)
### [P2886 [USACO07NOV]Cow Relays G](https://www.luogu.com.cn/problem/P2886)
这题与前几题有所不同，值得一做。

![[Pasted image 20230926192218.png]]

然后通过矩阵加速优化。
```cpp
#include<bits/stdc++.h>
using namespace std;
const int M=105;
int l,n=-1,m,st,en,x[M],y[M],w[M];
map<int,int>mp;
struct jz{
	int s[200][200];
	jz operator *(const jz &b){
		jz t;
		for(int i=0;i<=n;++i)for(int j=0;j<=n;++j) t.s[i][j]=1e9;
		for(int k=0;k<=n;++k)for(int i=0;i<=n;++i)for(int j=0;j<=n;++j)
			t.s[i][j]=min(t.s[i][j],s[i][k]+b.s[k][j]);
		return t;
	}
}a,e;
int main(){
	scanf("%d%d%d%d",&l,&m,&st,&en);
	for(int i=1;i<=m;++i){
		scanf("%d%d%d",&w[i],&x[i],&y[i]);
		if(!mp[x[i]]) mp[x[i]]=++n;
		if(!mp[y[i]]) mp[y[i]]=++n;
	}
	for(int i=0;i<=n;++i)for(int j=0;j<=n;++j) a.s[i][j]=1e9;
	for(int i=1;i<=m;++i) a.s[mp[x[i]]][mp[y[i]]]=a.s[mp[y[i]]][mp[x[i]]]=w[i];
	e=a,--l;
	while(l){
		if(l&1) e=e*a;
		l>>=1,a=a*a;
	}
	printf("%d",e.s[mp[st]][mp[en]]);
	return 0;
}
```
