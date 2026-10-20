---
public: true
---
#数据结构 #平衡树 

[平衡树学习笔记](https://www.luogu.com.cn/blog/Jianzi270/splay-tree)
## 模板 [P3369 【模板】普通平衡树](https://www.luogu.com.cn/problem/P3369)
```cpp
//易错 
//1.把当前点变成根（return）！  
//2.树由有变空，由空变有，splay的rt要改！ 
//3.push自己和父亲！ 
//4.rank和search注意num！！！ 
//5.splay  cle  要在最后！ 
//6.注意son和fa之间关系要更新！ 
//7.ch[k>tr[fa]][fa]
//8.rot！！！！del！！！ 
//9.要勤splay，把每次操作的数splay到根 
//10.rot注意顺序！！！ 
#include<bits/stdc++.h>
using namespace std;
int n,op,x,rt,cnt,tr[100005],ch[2][100005],siz[100005],f[100005],num[100005];
void cle(int k){tr[k]=siz[k]=num[k]=f[k]=ch[1][k]=ch[0][k]=0;}
void mt(int k){siz[k]=siz[ch[1][k]]+siz[ch[0][k]]+num[k];}
void rot(int k){//旋转 
	int fa=f[k],yy=f[fa],so=(ch[1][fa]==k);
	ch[so][fa]=ch[so^1][k];if(ch[so^1][k]) f[ch[so^1][k]]=fa;
	ch[so^1][k]=fa;f[fa]=k,f[k]=yy;
	if(yy) ch[ch[1][yy]==fa][yy]=k;
	mt(fa);mt(k);
}
void splay(int k){//将k旋转到根 
	for(int fa=f[k];fa=f[k],fa;rot(k))
		if(f[fa]) rot((ch[1][fa]==k)==(ch[1][f[fa]]==fa)?fa:k) ;
	rt=k;//!!! 
}
void ins(int k){//插入 
	if(!rt){tr[++cnt]=k,num[cnt]=siz[cnt]=1,rt=cnt;return ;}//rt=cnt!!!!
	int t=rt,fa=0;
	while(1){
		if(tr[t]==k){++num[t];mt(t);mt(fa);splay(t);return ;}//!!!++siz[f[t]]
		fa=t,t=ch[k>tr[fa]][fa];
		if(!t){
			tr[++cnt]=k,++num[cnt],f[cnt]=fa,ch[k>tr[fa]][fa]=cnt;
			mt(cnt),mt(fa),splay(cnt);//!!!!!!!!!!!!!!!
			return ;
		}
	}
}
int ran(int k){//x数的排名
	int t=rt,sum=0;
	while(1){
		if(k<tr[t]){t=ch[0][t];continue;}
		sum+=siz[ch[0][t]];
		if(k==tr[t]){splay(t);return sum+1;}//!!!splay
		sum+=num[t],t=ch[1][t];//+=num[t]!!!!!!!!
	}
}
int sea(int k){//排名为x的数
	int t=rt;
	while(1){
		if(siz[ch[0][t]]>=k){t=ch[0][t];continue;}
		if(siz[ch[0][t]]+num[t]>=k){splay(t);return tr[t];}
		k-=siz[ch[0][t]]+num[t],t=ch[1][t];
	}
}
int pre(int k){//前驱 
	int t=ch[0][rt];
	if(!t) return 0;
	while(ch[1][t]) t=ch[1][t];
	splay(t);
	return t;
}
int sub(int k){//后继 
	int t=ch[1][rt];
	if(!t) return 0;
	while(ch[0][t]) t=ch[0][t];
	splay(t);
	return t;
}
void del(int k){//删除 
	ran(k);
	if(num[rt]>1){--num[rt],--siz[rt];return ;} 
	if(!ch[0][rt]&&!ch[1][rt]){cle(rt);rt=0;return ;}//rt=0!!!
	if(!ch[0][rt]){int t=rt;rt=ch[1][rt],f[rt]=0;cle(t);return ;}
	if(!ch[1][rt]){int t=rt;rt=ch[0][rt],f[rt]=0;cle(t);return ;}
	int t=rt;pre(k);f[ch[1][t]]=rt,ch[1][rt]=ch[1][t],--siz[rt];cle(t);
}
int main(){
	scanf("%d",&n);
	for(int i=1;i<=n;++i){
		scanf("%d%d",&op,&x);
		if(op==1) ins(x);
		if(op==2) del(x);
		if(op==3) printf("%d\n",ran(x));
		if(op==4) printf("%d\n",sea(x));
		if(op==5){ins(x);printf("%d\n",tr[pre(x)]);del(x);}
		if(op==6){ins(x);printf("%d\n",tr[sub(x)]);del(x);}
	}
	return 0;
}
```
## 例题
### [P3391 【模板】文艺平衡树](https://www.luogu.com.cn/problem/P3391)
翻转就是整颗子树的每一个节点的左右儿子交换,而翻转l~r则是翻转平衡树中位置第l~r的节点（类似普通平衡树中第l~r大的数），最终的结果也就是整颗Splay的中序遍。因此，只需要在根节点的地方打一个懒标记,在search“排名”和中序遍历输出时push down一下。
### [P2234 [HNOI2002]营业额统计](https://www.luogu.com.cn/problem/P2234)
求前驱+后继
### [P2286 [HNOI2004]宠物收养场](https://www.luogu.com.cn/problem/P2286)
一树多用（处理好主人树和宠物树之间的变化）
