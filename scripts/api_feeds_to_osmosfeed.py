## read json from url https://api.tianheg.org/feeds?limit=200
# data structure:
## {"page":1,"limit":10,"total":154,"totalPages":16,"data":[{"rss":"","url":"http://whyes.org/","description":"肝癌","title":"whyes 的博客","id":1},{"rss":"https://mvread.blog/feed","url":"https://mvread.blog/","description":"这个人和评论尸一样喜欢写长文，很喜欢。读了他的《互联网公司变平庸的原因：不够爱国》","title":"最小可读 - 基本无害，可能有用","id":2},{"rss":"https://1q43.blog/feed","url":"https://1q43.blog/","description":"这个人写文章写得长又好，他写的《互联网与中国后现代性呓语》、《垄断的困境》都读过","title":"虹线 - 评论尸的自留地","id":3},{"rss":"","url":"https://juntao-qiu.medium.com/","description":"这个人是个React专家，他写的关于前端开发的文章值得一读，他的NewsLetter：https://juntao.substack.com/","title":"Juntao Qiu","id":4},{"rss":"https://idlewords.com/index.xml","url":"https://idlewords.com/","description":"这个人写了篇对NASA新登月计划——Artemis campaign（阿耳忒弥斯计划）的文章","title":"Idle Words - brevity is for the weak","id":5},{"rss":"","url":"https://www.mewho.com/","description":"这个人做了好几个关于太空的项目，有Star Trek，DoctorWho，还有 NASA 相关的","title":"meWho","id":6},{"rss":"https://world.hey.com/dhh/feed.atom","url":"https://world.hey.com/dhh","description":"知道这个人很久了，是 Ruby on Rails 的作者","title":"DHH","id":7},{"rss":"https://sive.rs/en.atom","url":"https://sive.rs/","description":"一位学习的榜样，学习他对生活、技术的态度，学习他思考世界的方法。他建立了/now页面 https://nownownow.com/","title":"Derek Sivers","id":8},{"rss":"https://changelog.com/podcast/feed","url":"https://changelog.com/podcast/","description":"唯一常听的技术博客，《软件那些事儿》栋哥推荐","title":"Changelog podcast","id":9},{"rss":"https://scottaaronson.blog/?feed=rss2","url":"https://scottaaronson.blog/","description":"The Blog of Scott Aaronson","title":"Shtetl-Optimized","id":10}]}

# check each data has rss url or not, if has get it out into a file called output.txt

import requests

url = "https://api.tianheg.org/feeds?limit=200"
response = requests.get(url)

if response.status_code == 200:
    data = response.json()
    with open("output.txt", "w") as f:
        for item in data["data"]:
            if item["rss"]:
                f.write("- href: " + item["rss"] + "\n")
else:
    print("Failed to retrieve data")