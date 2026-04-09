FROM node:lts

# Install gosu for user-switching entrypoint
RUN apt-get update \
 && apt-get install -y --no-install-recommends gosu \
 && rm -rf /var/lib/apt/lists/*

# Create docker group and svc user (match host IDs)
RUN groupadd -g 990 docker \
 && groupadd -g 105 svc \
 && useradd -u 104 -g svc -G docker -m -d /home/svc -s /bin/bash svc

# Entrypoint: run commands as RUN_USER via gosu
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

WORKDIR /workspace

ENTRYPOINT ["entrypoint.sh"]
CMD ["bash"]
