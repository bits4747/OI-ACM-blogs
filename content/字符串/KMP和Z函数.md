---
public: true
---
#字符串 
## 模板
### [P3375 【模板】KMP](https://www.luogu.com.cn/problem/P3375)
```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e6+5;
string a,b;
int la,lb,f[N];
int main(){
	ios::sync_with_stdio(0),cin.tie(0),cout.tie(0);
	cin>>a>>b,la=a.size(),lb=b.size();
	for(int i=1,j=0;i<lb;++i){
		while(j&&b[j]!=b[i]) j=f[j];
		if(b[j]==b[i]) ++j;
		f[i+1]=j;
	}
	for(int i=0,j=0;i<la;++i){
		while(j&&a[i]!=b[j]) j=f[j];
		if(b[j]==a[i]) ++j;
		if(j==lb) printf("%d\n",i-lb+2),j=f[j];
	}
	for(int i=1;i<=lb;++i) printf("%d ",f[i]);
	return 0;
}
```
### [P5410 【模板】扩展 KMP（Z 函数）](https://www.luogu.com.cn/problem/P5410)
记录 $l,r$，表示 $s[l,r]$ 是已确定右侧**最靠右**的 $Z-box$（ $s[l,r]$ 是 $s$ 的前缀）。

当前扫描到的位置为 $i$ ，若 $i\in (l,r]$ ，则我们可以利用 $Z-box$ 的性质复制 $z_{i-l}$，再暴力拓展，更新 $z_i$ 和 $l,r$。
```cpp
scanf("%s",s);
for(int i=1;i<n;++i){
	if(i<=r) z[i]=min(z[i-l],r-i+1);
	while(i+z[i]<n&&s[z[i]]==s[i+z[i]]) ++z[i];
	if(i+z[i]-1>r) r=i+z[i]-1,l=i;
}
```
**注意！**

![[Pasted image 20230919082828.png]]
## 例题
### [P2375 [NOI2014] 动物园](https://www.luogu.com.cn/problem/P2375)
**题意：**

多测，求字符串 $S$ 的 $num$ 数组。

$num$ 数组的定义是：字符串 $S$ 的前 $i$ 个字符构成的子串，既是它的后缀同时又是它的前缀，并且该后缀与该前缀不重叠，将这种字符串的数量记作 $num[i]$。

输出所有 $(num[i]+1)$ 的乘积，对 $1e9+7$ 取模的结果即可。

**题解：**

不考虑不重叠的性质，$num_i$ 为 $i$ 在 kmp 的 fail 树上的深度。

因此，先正常求出 $f$ 数组，记录深度 $d$（在 kmp 的 fail 树上，$f_i$ 为 $i$ 的父亲）。后再跑一次 kmp，当 $j$ 不符合规定时跳 fail 边。

**注释：**

按题意讲，$num_0$（即 $d_0$）该为 $0$，但我们不会计算 $num_0$ 的贡献，把其赋值为 $1$ 以便区分 $abc$ 这类以 $0$ 为根的和 $aba$ 这类以 $1$ 为根的答案。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=1e6+5,p=1e9+7;
char a[N];
int t,n,j,f[N],d[N],ans;
void work(){
	scanf("%s",a),n=strlen(a),j=0,d[1]=1;
	for(int i=1;i<n;++i){
		while(j&&a[i]!=a[j]) j=f[j];
		if(a[i]==a[j]) ++j;
		f[i+1]=j,d[i+1]=d[j]+1;
	}
	j=0,ans=1;
	for(int i=1;i<n;++i){
		while(j&&a[i]!=a[j]) j=f[j];
		if(a[i]==a[j]) ++j;
		if((j<<1)>i+1) j=f[j];
		ans=1ll*ans*(d[j]+1)%p;
	}
	printf("%d\n",ans);
}
int main(){
	scanf("%d",&t);
	while(t--) work();
}
```
### [P3426 [POI2005] SZA-Template](https://www.luogu.com.cn/problem/P3426)
首先，$s$ 的答案为其公共前后缀之一或其本身。

暴力的做法就是把所有公共前后缀都 check 一下。

考虑优化，我们可以发现 $i$ 和 $f_i$ 的公共前后缀集合只差了 $i$（令本身也为公共前后缀），因此 $dp_i=i 或 dp_{f_i}$。

当存在一点 $j$，使得 $dp_j=dp_{f_i},i-j\le f_i$，则 $dp_i=dp_{f_i}$。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=5e5+5;
char a[N];
int n,f[N],dp[N],j,c[N];
int main(){
	scanf("%s",a),n=strlen(a);
	for(int i=1;i<n;++i){
		while(j&&a[i]!=a[j]) j=f[j];
		if(a[i]==a[j]) ++j;
		f[i+1]=j;
	}
	for(int i=1;i<=n;++i) dp[i]=(i-c[dp[f[i]]]>f[i])?i:dp[f[i]],c[dp[i]]=i;
	printf("%d",dp[n]);
	return 0;
}
```
