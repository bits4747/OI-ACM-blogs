---
public: true
---
#字符串 
## [P3805 【模板】manacher 算法](https://www.luogu.com.cn/problem/P3805)
**求字符串 $S$ 中最长回文串的长度。**

通过在原字符串字符中间添加隔板把所有回文串统一为奇回文串。

记录一个 $mid$ 和 $r$，分别代表已经确定的右侧**最靠右**的回文串的**对称中心**和**右边界**。

当前扫描到的位置为 $i$ ，若 $i\in (mid,r]$ ，则我们可以利用回文性质复制对称点的 $p$（$p_i$ 表示以 $i$ 为对称中心奇回文串的半径）再暴力拓展，更新 $p_i$ 和 $mid,r,ans$。

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N=22e6+5;
int l,n,p[N],mid,r,ans;
char c[N>>1],s[N];
int main(){
	scanf("%s",c),l=strlen(c);
	s[0]='~';
	for(int i=0;i<l;++i) s[++n]='|',s[++n]=c[i];
	s[++n]='|',s[n+1]='!';
	for(int i=0;i<=n;++i){
		if(i<=r) p[i]=min(p[(mid<<1)-i],r-i+1);
		while(s[i+p[i]]==s[i-p[i]]) ++p[i];
		if(i+p[i]-1>r) r=i+p[i]-1,mid=i;
		ans=max(ans,p[i]);
	}
	printf("%d",ans-1);
	return 0;
}
```
